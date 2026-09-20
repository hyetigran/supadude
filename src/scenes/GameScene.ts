import Phaser from "phaser";
import { GameState } from "../game/GameState";
import { InputManager } from "../game/InputManager";
import { KeyboardAdapter } from "../game/KeyboardAdapter";
import { PlayerState, type PowerColor } from "../game/PlayerState";
import { ObstacleField } from "../game/ObstacleField";
import { CollectibleField } from "../game/CollectibleField";
import { MarkerField, type MarkerEvent } from "../game/MarkerField";
import { BossFightController } from "../game/BossFightController";
import { LEVEL } from "../game/Level";
import { LevelProgress } from "../game/LevelProgress";
import { formatCompletionTime } from "../game/formatCompletionTime";
import type { Lane, LaneMove } from "../game/Lane";
import { createNeighborhoodLayout, type NeighborhoodLayout } from "../game/LaneLayout";
import {
  BOSS_HEIGHT,
  DEPTH_BACKGROUND,
  DEPTH_HUD,
  DEPTH_PLAYER,
  DEPTH_SKY_DECOR,
  DUCK_SCALE_Y,
  IDLE_BOB_PX,
  JUMP_HEIGHT,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_CAPE_COLOR,
  PLAYER_HEAD_RADIUS,
  PLAYER_STAND_HEIGHT,
} from "../game/VisualScale";
import { PauseOverlay } from "./PauseOverlay";
import { Fx } from "./Fx";
import { Sfx } from "../game/Sfx";
import {
  ANIM_SPECS,
  SPRITE_DISPLAY_SCALE,
  SPRITE_SHEET_KEY,
  animKeyForVerticalState,
  type AnimSpec,
  type SpriteAnimKey,
} from "../game/PlayerSpriteAnim";

const CHARACTER_X = 200;
const SCROLL_SPEED = 220; // px/sec
const BACKGROUND_TEXTURE = "placeholder-background";
const BACKGROUND_TILE_WIDTH = 160;

const JUMP_DURATION_MS = 420;
const DUCK_DURATION_MS = 500;
const LANE_SWITCH_DURATION_MS = 150;
const HIT_ANIM_DURATION_MS = 130; // matches the existing HIT_FLASH_COLOR flash duration below
const PUNCH_ANIM_DURATION_MS = 260; // ~3 frames at the punch anim's 12fps (see PlayerSpriteAnim.ts ANIM_SPECS)
const POWER_DURATION_MS = 5000;
const BOSS_X_OFFSET = 220; // distance right of Supa Dude the boss placeholder sits at

const PROGRESS_BAR_HEIGHT = 6;
const PROGRESS_BAR_BOTTOM_PAD = 8;
const PROGRESS_BAR_TRACK_COLOR = 0x000000;
const PROGRESS_BAR_TRACK_ALPHA = 0.35;
const PROGRESS_BAR_FILL_COLOR = 0x4ade80;
const PAUSE_BUTTON_SIZE = 36;
const PAUSE_BUTTON_PAD = 12;

const SKY_COLOR = 0x87ceeb;
const TREE_LAWN_COLOR = 0x6b8e4e;
const SIDEWALK_COLOR = 0xc4c4c0;
const CURB_COLOR = 0x9a9a96;
const STREET_COLOR = 0x3f3f46;
const STREET_DASH_COLOR = 0xfbbf24;
const FENCE_COLOR = 0x8b5a2b;
const STREET_DASH_WIDTH = 28;
const STREET_DASH_GAP = 22;
const STREET_DASH_HEIGHT = 4;
const STREET_DASH_BOTTOM_PAD = 14;

// Parallax sky decor: clouds drift slower than the neighborhood scroll,
// distant rooftops slower still than the foreground but faster than clouds
// — the classic two-layer depth cue behind an otherwise flat background.
const CLOUDS_TEXTURE = "placeholder-clouds";
const CLOUD_LAYER_TILE_WIDTH = 240;
const CLOUD_PARALLAX_FACTOR = 0.25;
const CLOUD_COLOR = 0xffffff;
const CLOUD_ALPHA = 0.8;
const SKYLINE_TEXTURE = "placeholder-skyline";
const SKYLINE_LAYER_TILE_WIDTH = 300;
const SKYLINE_PARALLAX_FACTOR = 0.55;
const SKYLINE_COLOR = 0x6b84a3;
const SKYLINE_WINDOW_COLOR = 0xa9c2de;

const HIT_FLASH_COLOR = 0xff0000;
const FIRE_POWER_COLOR = 0xff6a00;
const WATER_POWER_COLOR = 0x00b4ff;
const COIN_BURST_COLOR = 0xffd700;
const HEART_BURST_COLOR = 0xff4d6d;
const BLOCKER_BURST_COLOR = 0xffe066;
const BOSS_HIT_BURST_COLOR = 0xffd400;
const BOSS_DEFEAT_BURST_COLOR = 0x6b21a8;

/**
 * Three-Lane dodge core loop through the authored Level (see Level.ts,
 * ADR-0003): Left/Right shifts one step across Sidewalk/Tree Lawn/Street,
 * independently of Jump/Duck. A miss costs a Life; 0 Lives pauses for a continue
 * prompt, then respawns at the most recent Checkpoint with Lives reset to 3
 * — there is no terminal "Game Over" in this loop, only retries (see
 * CONTEXT.md Attempt). Score is the running Coins-collected count (ADR-0005)
 * and is unaffected by dying. Hearts restore Lives. Clearing a Power-up
 * Car grants a held Power, which the activation input arms to destroy a
 * matching Blocker Obstacle on contact. Reaching the end of the Level shows
 * a results screen with Score and the Coin completion stat. Reaching the
 * Final Boss marker stops auto-run and hands off to BossFightController for
 * the dodge-and-riposte Boss Fight (CONTEXT.md) — a single climactic
 * encounter near the end of the Level, not several spread through it
 * (ADR-0004). Play is gated behind a start overlay on scene create.
 */
export class GameScene extends Phaser.Scene {
  readonly gameState = new GameState();
  private playerInput!: InputManager;
  private playerState!: PlayerState;
  private neighborhoodLayout!: NeighborhoodLayout;
  private obstacleField!: ObstacleField;
  private collectibleField!: CollectibleField;
  private markerField!: MarkerField;
  private levelProgress!: LevelProgress;
  private keyboardAdapter?: KeyboardAdapter;
  private pauseOverlay!: PauseOverlay;
  private pauseButton?: Phaser.GameObjects.Container;
  private background?: Phaser.GameObjects.TileSprite;
  private cloudsLayer?: Phaser.GameObjects.TileSprite;
  private skylineLayer?: Phaser.GameObjects.TileSprite;
  private character?: Phaser.GameObjects.Container;
  /** Set only when public/sprites/supa-dude.png has loaded; undefined means the primitive-drawn fallback is in play. */
  private characterSprite?: Phaser.GameObjects.Sprite;
  private fx!: Fx;
  private readonly sfx = new Sfx();
  private powerIndicator?: Phaser.GameObjects.Arc;
  private hudText?: Phaser.GameObjects.Text;
  private progressBarFill?: Phaser.GameObjects.Rectangle;
  private idleTween?: Phaser.Tweens.Tween;
  private powerExpiryTimer?: Phaser.Time.TimerEvent;
  private bossFightController?: BossFightController;
  private traveledDistance = 0;
  private attemptStartTimeMs = 0;
  private isComplete = false;
  private isPaused = false;
  private inBossFight = false;
  private bossDefeated = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.gameState.resetForNewAttempt();
    this.playerInput = new InputManager();
    this.playerState = new PlayerState();
    this.neighborhoodLayout = createNeighborhoodLayout(this.scale.height);
    this.levelProgress = new LevelProgress(LEVEL.checkpoint, LEVEL.length);
    this.pauseOverlay = new PauseOverlay(this);
    this.powerExpiryTimer?.remove();
    this.bossFightController?.destroy();
    this.bossFightController = undefined;
    this.traveledDistance = 0;
    this.attemptStartTimeMs = 0;
    this.isComplete = false;
    this.isPaused = true;
    this.inBossFight = false;
    this.bossDefeated = false;

    this.fx = new Fx(this);

    this.createBackgroundTexture();
    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, BACKGROUND_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_BACKGROUND);

    const neighborhoodTop = this.neighborhoodLayout.neighborhoodTop;
    this.createCloudsTexture(neighborhoodTop);
    this.cloudsLayer = this.add
      .tileSprite(0, 0, this.scale.width, neighborhoodTop, CLOUDS_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_SKY_DECOR);
    this.createSkylineTexture(neighborhoodTop);
    this.skylineLayer = this.add
      .tileSprite(0, 0, this.scale.width, neighborhoodTop, SKYLINE_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_SKY_DECOR + 0.1);

    this.character = this.createCharacterPlaceholder();
    this.idleTween?.pause();
    this.hudText = this.add.text(12, 12, "", { fontSize: "14px", color: "#ffffff" }).setDepth(DEPTH_HUD);
    this.updateHud();
    this.pauseButton = this.createPauseButton();

    const progressBarY = this.scale.height - PROGRESS_BAR_BOTTOM_PAD - PROGRESS_BAR_HEIGHT;
    this.add
      .rectangle(0, progressBarY, this.scale.width, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_TRACK_COLOR, PROGRESS_BAR_TRACK_ALPHA)
      .setOrigin(0, 0)
      .setDepth(DEPTH_HUD);
    this.progressBarFill = this.add
      .rectangle(0, progressBarY, 0, PROGRESS_BAR_HEIGHT, PROGRESS_BAR_FILL_COLOR)
      .setOrigin(0, 0)
      .setDepth(DEPTH_HUD + 1);
    this.updateProgressBar();

    this.obstacleField = new ObstacleField(
      this,
      {
        lanePresentation: (lane) => this.neighborhoodLayout.lanes[lane],
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
        getPlayerPose: () => ({ lane: this.playerState.getLane(), verticalState: this.playerState.getState() }),
        getActivePower: () => (this.playerState.isPowerActivated() ? this.playerState.getPower() : null),
        onMissed: () => this.handleCollision(),
        onPowerCollected: (color) => this.handlePowerCollected(color),
        onBlockerDestroyed: () => this.handleBlockerDestroyed(),
      },
      LEVEL.obstacles,
    );

    this.collectibleField = new CollectibleField(
      this,
      {
        lanePresentation: (lane) => this.neighborhoodLayout.lanes[lane],
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
        getLane: () => this.playerState.getLane(),
        onHeartCollected: () => this.handleHeartCollected(),
        onCoinCollected: () => this.handleCoinCollected(),
      },
      LEVEL.collectibles,
    );

    this.markerField = new MarkerField(
      this,
      {
        lanePresentation: (lane) => this.neighborhoodLayout.lanes[lane],
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
      },
      buildMarkerEvents(),
    );

    this.playerInput.on("jump", () => this.handleJump());
    this.playerInput.on("duck", () => this.handleDuck());
    this.playerInput.on("laneLeft", () => this.handleLaneShift("towardSidewalk"));
    this.playerInput.on("laneRight", () => this.handleLaneShift("towardStreet"));
    this.playerInput.on("powerActivate", () => this.handlePowerActivate());
    this.playerInput.on("punch", () => this.handlePunch());
    this.playerInput.on("pause", () => this.handlePause());

    if (this.input.keyboard) {
      this.keyboardAdapter = new KeyboardAdapter(this.input.keyboard, this.playerInput);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pauseOverlay.destroy();
      this.keyboardAdapter?.destroy();
    });

    this.pauseOverlay.show("start", () => this.beginPlay());
  }

  update(_time: number, delta: number): void {
    if (this.isComplete || this.isPaused) return;

    this.updatePowerIndicator();
    this.updateHud();

    // A Boss Fight stops auto-run entirely (CONTEXT.md Final Boss): traveled
    // distance, the background, and the Obstacle/Collectible/Marker fields
    // all freeze. BossFightController runs on its own Phaser timers, so it
    // keeps ticking even though this frame returns early.
    if (this.inBossFight) return;

    const dx = (SCROLL_SPEED * delta) / 1000;
    this.traveledDistance += dx;
    if (this.background) this.background.tilePositionX += dx;
    if (this.cloudsLayer) this.cloudsLayer.tilePositionX += dx * CLOUD_PARALLAX_FACTOR;
    if (this.skylineLayer) this.skylineLayer.tilePositionX += dx * SKYLINE_PARALLAX_FACTOR;
    this.updateProgressBar();

    this.levelProgress.update(this.traveledDistance);
    if (this.levelProgress.isComplete(this.traveledDistance)) {
      this.triggerLevelComplete();
      return;
    }

    if (!this.bossDefeated && this.traveledDistance >= LEVEL.bossMarker) {
      this.startBossFight();
      return;
    }

    this.obstacleField.update(delta);
    this.collectibleField.update(delta);
    this.markerField.update(delta);
  }

  private getGroundYForLane(lane: Lane): number {
    return this.neighborhoodLayout.lanes[lane].groundY;
  }

  /** Boss combat is a fixed Street-based arena, outside normal Lane movement. */
  private getActivePresentationLane(): Lane {
    return this.inBossFight ? "street" : this.playerState.getLane();
  }

  private getActiveGroundY(): number {
    return this.getGroundYForLane(this.getActivePresentationLane());
  }

  /** Keep Supa Dude in the same depth/perspective contract as Lane content. */
  private applyCharacterLanePresentation(lane: Lane): void {
    if (!this.character) return;
    const presentation = this.neighborhoodLayout.lanes[lane];
    const depth = this.inBossFight ? DEPTH_PLAYER : presentation.depth + 0.5;
    this.character.setDepth(depth).setScale(presentation.scale);
  }

  /**
   * Repeating neighborhood tile: sky, Sidewalk, Tree Lawn, and Street.
   */
  private createBackgroundTexture(): void {
    const width = BACKGROUND_TILE_WIDTH;
    const height = this.scale.height;
    const { neighborhoodTop: sidewalkTop, treeLawnTop, streetTop } = this.neighborhoodLayout;

    const graphics = this.add.graphics();

    // Sky
    graphics.fillStyle(SKY_COLOR, 1);
    graphics.fillRect(0, 0, width, sidewalkTop);

    // Sidewalk Lane
    graphics.fillStyle(SIDEWALK_COLOR, 1);
    graphics.fillRect(0, sidewalkTop, width, treeLawnTop - sidewalkTop);
    graphics.lineStyle(1, CURB_COLOR, 1);
    graphics.lineBetween(0, sidewalkTop, width, sidewalkTop);
    graphics.lineBetween(0, treeLawnTop, width, treeLawnTop);

    // Tree Lawn Lane
    graphics.fillStyle(TREE_LAWN_COLOR, 1);
    graphics.fillRect(0, treeLawnTop, width, streetTop - treeLawnTop);
    graphics.lineStyle(1, CURB_COLOR, 1);
    graphics.lineBetween(0, streetTop, width, streetTop);

    // Street Lane
    graphics.fillStyle(STREET_COLOR, 1);
    graphics.fillRect(0, streetTop, width, height - streetTop);

    // Yellow dashes along the bottom of the Street
    const dashY = height - STREET_DASH_BOTTOM_PAD - STREET_DASH_HEIGHT;
    graphics.fillStyle(STREET_DASH_COLOR, 1);
    for (let x = 8; x < width; x += STREET_DASH_WIDTH + STREET_DASH_GAP) {
      graphics.fillRect(x, dashY, STREET_DASH_WIDTH, STREET_DASH_HEIGHT);
    }

    // Fence post landmark on the Tree Lawn
    graphics.fillStyle(FENCE_COLOR, 1);
    graphics.fillRect(width - 6, streetTop - 34, 6, 34);

    graphics.generateTexture(BACKGROUND_TEXTURE, width, height);
    graphics.destroy();
  }

  /** Soft translucent cloud shapes tiled across the sky band, scrolled slower than the foreground for parallax depth (see CLOUD_PARALLAX_FACTOR). */
  private createCloudsTexture(bandHeight: number): void {
    const width = CLOUD_LAYER_TILE_WIDTH;
    const graphics = this.add.graphics();
    graphics.fillStyle(CLOUD_COLOR, CLOUD_ALPHA);
    graphics.fillEllipse(width * 0.25, bandHeight * 0.35, 64, 22);
    graphics.fillEllipse(width * 0.25 + 20, bandHeight * 0.35 - 10, 40, 18);
    graphics.fillEllipse(width * 0.75, bandHeight * 0.6, 50, 18);
    graphics.generateTexture(CLOUDS_TEXTURE, width, bandHeight);
    graphics.destroy();
  }

  /** Distant rooftop silhouette above the Sidewalk, faster than clouds but slower than the foreground. */
  private createSkylineTexture(bandHeight: number): void {
    const width = SKYLINE_LAYER_TILE_WIDTH;
    const graphics = this.add.graphics();
    const buildings = [
      { x: 0, w: 60, h: bandHeight * 0.35 },
      { x: 66, w: 44, h: bandHeight * 0.5 },
      { x: 118, w: 70, h: bandHeight * 0.3 },
      { x: 196, w: 50, h: bandHeight * 0.45 },
      { x: 254, w: 46, h: bandHeight * 0.32 },
    ];
    graphics.fillStyle(SKYLINE_COLOR, 1);
    for (const b of buildings) {
      graphics.fillRect(b.x, bandHeight - b.h, b.w, b.h);
    }
    graphics.fillStyle(SKYLINE_WINDOW_COLOR, 0.6);
    for (const b of buildings) {
      for (let wy = bandHeight - b.h + 6; wy < bandHeight - 6; wy += 10) {
        for (let wx = b.x + 6; wx < b.x + b.w - 6; wx += 10) {
          graphics.fillRect(wx, wy, 3, 3);
        }
      }
    }
    graphics.generateTexture(SKYLINE_TEXTURE, width, bandHeight);
    graphics.destroy();
  }

  private createCharacterPlaceholder(): Phaser.GameObjects.Container {
    const presentation = this.neighborhoodLayout.lanes[this.playerState.getLane()];
    const groundY = presentation.groundY;

    // Feet at local y=0 so the container sits on the lane baseline and duck
    // squash (scaleY) contracts toward the ground rather than through it.
    const children: Phaser.GameObjects.GameObject[] = [];
    if (this.textures.exists(SPRITE_SHEET_KEY)) {
      this.registerCharacterAnims();
      this.characterSprite = this.add
        .sprite(0, 0, SPRITE_SHEET_KEY, ANIM_SPECS.idle.start)
        .setOrigin(0.5, 1)
        .setScale(SPRITE_DISPLAY_SCALE);
      children.push(this.characterSprite);
    } else {
      const body = this.add.rectangle(0, 0, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, 0x000000).setOrigin(0.5, 1);
      const headY = -(PLAYER_BODY_HEIGHT + PLAYER_HEAD_RADIUS);
      const head = this.add.circle(0, headY, PLAYER_HEAD_RADIUS, 0x000000);
      const cape = this.add.triangle(-4, -PLAYER_BODY_HEIGHT * 0.5, 0, -PLAYER_BODY_HEIGHT * 0.55, -10, 0, 4, 0, PLAYER_CAPE_COLOR);
      children.push(cape, body, head);
    }
    this.powerIndicator = this.add.circle(0, -(PLAYER_STAND_HEIGHT + 8), 8, 0xffffff, 0).setVisible(false);
    children.push(this.powerIndicator);

    const character = this.add.container(CHARACTER_X, groundY, children);
    character.setDepth(presentation.depth + 0.5).setScale(presentation.scale);
    this.startIdleTween(character, groundY);

    return character;
  }

  /** Registered once per Scene lifetime — anims persist in Phaser's global AnimationManager across scene restarts. */
  private registerCharacterAnims(): void {
    if (this.anims.exists("idle")) return;
    for (const [key, spec] of Object.entries(ANIM_SPECS) as [SpriteAnimKey, AnimSpec][]) {
      this.anims.create({
        key,
        frames: this.anims.generateFrameNumbers(SPRITE_SHEET_KEY, { start: spec.start, end: spec.end }),
        frameRate: spec.frameRate,
        repeat: spec.repeat,
      });
    }
  }

  /** No-op under the primitive fallback (this.characterSprite is only set once real art has loaded). */
  private playCharacterAnim(key: SpriteAnimKey): void {
    if (!this.characterSprite) return;
    if (this.characterSprite.anims.currentAnim?.key === key) return;
    this.characterSprite.play(key);
  }

  private steadyCharacterAnimKey(): SpriteAnimKey {
    const state = this.playerState.getState();
    return this.inBossFight && state === "grounded" ? "idle" : animKeyForVerticalState(state);
  }

  /** Shows a small dot above Supa Dude's head while a Power is held (dim) or activated (bright) — no Power, no dot. */
  private updatePowerIndicator(): void {
    if (!this.powerIndicator) return;

    const power = this.playerState.getPower();
    if (!power) {
      this.powerIndicator.setVisible(false);
      return;
    }

    const color = power === "fire" ? 0xff6a00 : 0x00b4ff;
    const alpha = this.playerState.isPowerActivated() ? 1 : 0.5;
    this.powerIndicator.setVisible(true).setFillStyle(color, alpha);
  }

  private updateHud(): void {
    this.hudText?.setText(`Lives ${this.gameState.getLives()}   Score ${this.gameState.getScore()}`);
  }

  /** Top-right HUD control — opens the mid-run pause overlay (also Escape / P). */
  private createPauseButton(): Phaser.GameObjects.Container {
    const x = this.scale.width - PAUSE_BUTTON_PAD - PAUSE_BUTTON_SIZE / 2;
    const y = PAUSE_BUTTON_PAD + PAUSE_BUTTON_SIZE / 2;

    const bg = this.add.rectangle(0, 0, PAUSE_BUTTON_SIZE, PAUSE_BUTTON_SIZE, 0x000000, 0.45);
    const barLeft = this.add.rectangle(-5, 0, 5, 16, 0xffffff);
    const barRight = this.add.rectangle(5, 0, 5, 16, 0xffffff);
    // Zone on top so clicks on the bars still register (input topOnly).
    const hit = this.add
      .zone(0, 0, PAUSE_BUTTON_SIZE, PAUSE_BUTTON_SIZE)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });

    const button = this.add.container(x, y, [bg, barLeft, barRight, hit]);
    button.setDepth(DEPTH_HUD + 2);
    button.setVisible(false);

    hit.on("pointerdown", (_pointer: Phaser.Input.Pointer, _lx: number, _ly: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handlePause();
    });

    return button;
  }

  /** A thin bar across the bottom of the screen showing how far through the Level the player has traveled. */
  private updateProgressBar(): void {
    if (!this.progressBarFill) return;
    const progress = Phaser.Math.Clamp(this.traveledDistance / LEVEL.length, 0, 1);
    this.progressBarFill.setSize(this.scale.width * progress, PROGRESS_BAR_HEIGHT);
  }

  private handlePowerCollected(color: PowerColor): void {
    this.playerState.collectPower(color);
    this.powerExpiryTimer?.remove();
    this.powerExpiryTimer = this.time.delayedCall(POWER_DURATION_MS, () => this.playerState.clearPower());
    this.sfx.play("powerCollect");
    this.fx.burst(this.charX(), this.charY(), color === "fire" ? FIRE_POWER_COLOR : WATER_POWER_COLOR);
  }

  private handleHeartCollected(): void {
    this.gameState.gainLife();
    this.sfx.play("heart");
    this.fx.burst(this.charX(), this.charY(), HEART_BURST_COLOR, { count: 8, gravityY: -40 });
  }

  private handleCoinCollected(): void {
    this.gameState.collectCoin();
    this.sfx.play("coin");
    this.fx.burst(this.charX(), this.charY(), COIN_BURST_COLOR, { count: 6, lifespanMs: 260, speedMax: 110 });
  }

  private handleBlockerDestroyed(): void {
    this.playerState.clearPower();
    this.sfx.play("blockerDestroyed");
    this.fx.burst(this.charX(), this.charY(), BLOCKER_BURST_COLOR, { count: 14, speedMax: 200 });
  }

  private handleBossPunchLanded(): void {
    this.sfx.play("bossHit");
    this.fx.shake(90, 0.006);
    this.fx.burst(CHARACTER_X + BOSS_X_OFFSET, this.getGroundYForLane("street") - BOSS_HEIGHT * 0.5, BOSS_HIT_BURST_COLOR, {
      count: 12,
      speedMax: 180,
    });
  }

  private handlePowerActivate(): void {
    if (this.isComplete || this.isPaused) return;
    if (this.playerState.activatePower()) this.sfx.play("powerActivate");
  }

  /** Punch only ever does anything mid-Boss Fight, during the Vulnerable Window (CONTEXT.md Punch). */
  private handlePunch(): void {
    if (this.isComplete || this.isPaused) return;
    this.sfx.play("punch");
    this.playCharacterAnim("punch");
    this.time.delayedCall(PUNCH_ANIM_DURATION_MS, () => this.playCharacterAnim(this.steadyCharacterAnimKey()));
    this.bossFightController?.punch();
  }

  private charX(): number {
    return this.character?.x ?? CHARACTER_X;
  }

  private charY(): number {
    return this.character?.y ?? this.getActiveGroundY();
  }

  // A quick, slightly-tilting bounce reads as a running stride; final
  // sprite-sheet animation replaces this in the art-integration ticket.
  // Re-anchored on each Lane Shift since the bounce's rest position is
  // baked in relative to whichever baseline was current when it started.
  // Paused during Jump/Duck so idle bob never fights overhead clearance.
  private startIdleTween(character: Phaser.GameObjects.Container, baselineY: number): void {
    this.idleTween?.stop();

    // With real art, the run-cycle animation itself carries the motion — stacking
    // the fake bounce/tilt on top would double up. Just pin to baseline and
    // resume whichever steady-state pose matches the current vertical state.
    if (this.characterSprite) {
      character.y = baselineY;
      character.angle = 0;
      this.playCharacterAnim(this.steadyCharacterAnimKey());
      return;
    }

    this.idleTween = this.tweens.add({
      targets: character,
      y: baselineY - IDLE_BOB_PX,
      angle: { from: -4, to: 4 },
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }

  /** Shared end-of-pose bookkeeping for both handleJump and handleDuck. */
  private finishPose(revertState: () => void): void {
    revertState();
    if (this.character) {
      const presentationLane = this.getActivePresentationLane();
      this.applyCharacterLanePresentation(presentationLane);
      this.startIdleTween(this.character, this.getGroundYForLane(presentationLane));
    }
  }

  private handleJump(): void {
    if (this.isComplete || this.isPaused || !this.character) return;
    if (!this.playerState.jump()) return;

    this.sfx.play("jump");
    this.playCharacterAnim("jump");
    const groundY = this.getActiveGroundY();
    this.idleTween?.pause();
    this.tweens.add({
      targets: this.character,
      y: groundY - JUMP_HEIGHT,
      angle: 0,
      duration: JUMP_DURATION_MS / 2,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => {
        this.sfx.play("land");
        this.fx.burst(this.charX(), groundY, 0xd6d3d1, { count: 5, lifespanMs: 220, speedMax: 60, gravityY: 60 });
        this.finishPose(() => this.playerState.land());
      },
    });
  }

  private handleDuck(): void {
    if (this.isComplete || this.isPaused || !this.character) return;
    if (!this.playerState.duck()) return;

    this.sfx.play("duck");
    this.idleTween?.pause();
    this.character.y = this.getActiveGroundY();
    if (this.characterSprite) {
      // Real art draws the crouch as its own frame — no geometric squash needed.
      this.playCharacterAnim("duck");
    } else {
      // Squash toward feet (local y=0) — reads as a crouch under Overhead Obstacles.
      const laneScale = this.neighborhoodLayout.lanes[this.getActivePresentationLane()].scale;
      this.character.setScale(laneScale, laneScale * DUCK_SCALE_Y);
    }
    this.time.delayedCall(DUCK_DURATION_MS, () => {
      this.finishPose(() => this.playerState.standUp());
    });
  }

  private handleLaneShift(move: LaneMove): void {
    // Boss Fights aren't Lane-based (CONTEXT.md Boss Fight) — disabled so the
    // boss's fixed-position placeholder UI never desyncs from Supa Dude's row.
    if (this.isComplete || this.isPaused || this.inBossFight || !this.character) return;

    if (!this.playerState.moveLane(move)) return;
    this.sfx.play("laneSwitch");
    // Jump/duck already have their own y target baked into their in-flight
    // tween/timer; switching mid-pose updates the Lane immediately (so
    // collision resolution is always correct) but the visual re-anchor
    // happens on the next finishPose, not mid-animation.
    if (this.playerState.getState() !== "grounded") return;

    const presentation = this.neighborhoodLayout.lanes[this.playerState.getLane()];
    const newGroundY = presentation.groundY;
    this.idleTween?.pause();
    this.tweens.killTweensOf(this.character);
    this.playCharacterAnim("laneSwitch");
    this.character.setDepth(presentation.depth + 0.5);
    this.tweens.add({
      targets: this.character,
      y: newGroundY,
      scaleX: presentation.scale,
      scaleY: presentation.scale,
      duration: LANE_SWITCH_DURATION_MS,
      ease: "Sine.easeInOut",
      onComplete: () => {
        if (this.character) this.startIdleTween(this.character, newGroundY);
      },
    });
  }

  private handleCollision(): void {
    if (this.isPaused || this.isComplete) return;

    this.gameState.loseLife();
    this.updateHud();
    this.sfx.play("hit");
    this.fx.shake(160, 0.01);
    this.fx.flash(HIT_FLASH_COLOR, 130);
    this.fx.burst(this.charX(), this.charY(), HIT_FLASH_COLOR, { count: 10, speedMax: 150 });
    this.playCharacterAnim("hit");
    this.time.delayedCall(HIT_ANIM_DURATION_MS, () => this.playCharacterAnim(this.steadyCharacterAnimKey()));
    if (this.gameState.hasNoLivesLeft()) {
      this.showOutOfLivesPause();
    }
  }

  /** First dismiss of the start overlay — auto-run and the Attempt timer begin here. */
  private beginPlay(): void {
    this.isPaused = false;
    this.attemptStartTimeMs = this.time.now;
    this.pauseButton?.setVisible(true);
    this.resumeWorld();
  }

  /** HUD / Escape / P — soft-pauses mid-Attempt without resetting pose or abandoning a Boss Fight. */
  private handlePause(): void {
    if (this.isPaused || this.isComplete) return;

    this.sfx.play("pause");
    this.isPaused = true;
    this.pauseButton?.setVisible(false);
    this.softFreezeWorld();
    this.pauseOverlay.show("pause", () => this.resumeFromUserPause());
  }

  /**
   * 0 Lives: freeze the world and prompt to continue. Dismissing respawns at
   * the Checkpoint (Score untouched — ADR-0005) rather than ending the Attempt.
   */
  private showOutOfLivesPause(): void {
    this.isPaused = true;
    this.pauseButton?.setVisible(false);
    this.freezeWorld();
    this.pauseOverlay.show("lives", () => {
      this.respawnAtCheckpoint();
      this.isPaused = false;
      this.pauseButton?.setVisible(true);
      this.resumeWorld();
    });
  }

  /**
   * Soft mid-run pause: stop scroll + freeze Phaser clock/tweens so Jump/Duck
   * and Boss Fight timers hold in place. Does not destroy the boss or reset pose.
   */
  private softFreezeWorld(): void {
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();
    this.tweens.pauseAll();
    this.time.paused = true;
  }

  private resumeFromUserPause(): void {
    this.time.paused = false;
    this.tweens.resumeAll();
    this.isPaused = false;
    this.pauseButton?.setVisible(true);
    if (!this.inBossFight) {
      this.obstacleField.start();
      this.collectibleField.start();
      this.markerField.start();
    }
  }

  /** Hard freeze for 0 Lives — abandons a mid-fight Boss and resets pose for the Checkpoint respawn. */
  private freezeWorld(): void {
    this.time.paused = false;
    this.tweens.resumeAll();
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();

    if (this.inBossFight) {
      this.bossFightController?.destroy();
      this.bossFightController = undefined;
      this.inBossFight = false;
    }

    if (this.character) {
      this.tweens.killTweensOf(this.character);
      this.character.setAngle(0);
      this.character.y = this.getGroundYForLane(this.playerState.getLane());
    }
    this.playerState.land();
    this.applyCharacterLanePresentation(this.playerState.getLane());
  }

  private resumeWorld(): void {
    this.obstacleField.start();
    this.collectibleField.start();
    this.markerField.start();
    if (this.character) {
      this.startIdleTween(this.character, this.getGroundYForLane(this.playerState.getLane()));
    }
  }

  /**
   * Reaching the Final Boss marker: stops auto-run and the
   * Obstacle/Collectible/Marker fields, hands off to a BossFightController.
   * Getting hit costs a Life via the same handleCollision as a normal
   * Obstacle — 0 Lives mid-fight pauses for continue, then respawns at the
   * Checkpoint before the boss exactly like any other death
   * (see showOutOfLivesPause / respawnAtCheckpoint).
   * Boss is pinned to the Street baseline so the fight reads as a fixed arena
   * regardless of which Lane the player arrived on.
   */
  private startBossFight(): void {
    this.inBossFight = true;
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();

    // The Boss arena is outside the Lane model; Street supplies its visual baseline.
    const arenaY = this.getGroundYForLane("street");
    if (this.character) {
      this.tweens.killTweensOf(this.character);
      this.character.setScale(1, 1);
      this.character.setDepth(DEPTH_PLAYER);
      this.character.setPosition(CHARACTER_X, arenaY);
    }
    // Auto-run stops for the fight, so the run-cycle animation would read as
    // running-in-place; hold on idle until dodges/punches/hits play their own pose.
    this.playCharacterAnim("idle");
    this.bossFightController = new BossFightController(this, {
      x: CHARACTER_X + BOSS_X_OFFSET,
      groundY: arenaY,
      getPlayerState: () => this.playerState.getState(),
      onHit: () => this.handleCollision(),
      onPunchLanded: () => this.handleBossPunchLanded(),
      onDefeated: () => this.handleBossDefeated(),
    });
  }

  private handleBossDefeated(): void {
    this.bossDefeated = true;
    this.sfx.play("bossDefeated");
    this.fx.shake(320, 0.014);
    this.fx.burst(CHARACTER_X + BOSS_X_OFFSET, this.getGroundYForLane("street") - BOSS_HEIGHT * 0.5, BOSS_DEFEAT_BURST_COLOR, {
      count: 26,
      speedMax: 240,
      lifespanMs: 520,
    });
    this.exitBossFight();
  }

  /**
   * 0 Lives mid-Level: after the continue prompt, respawn at the most recent
   * Checkpoint with Lives reset to 3 (see CONTEXT.md Checkpoint) rather than
   * ending the Attempt — the Level keeps going. Score (Coins collected) is
   * untouched by this; dying never costs it (see ADR-0005). If this happened
   * mid-Boss Fight, that fight was already abandoned in freezeWorld; traveled
   * distance rewinds to the Checkpoint immediately before the boss, so
   * reaching the marker again naturally restarts a fresh attempt at it.
   */
  private respawnAtCheckpoint(): void {
    this.gameState.respawnAtCheckpoint();

    const checkpointDistance = this.levelProgress.getCheckpointDistance();
    this.traveledDistance = checkpointDistance;
    this.obstacleField.seek(checkpointDistance);
    this.collectibleField.seek(checkpointDistance);
    this.markerField.seek(checkpointDistance);

    this.playerState.resetForAttempt();
    this.powerExpiryTimer?.remove();

    if (this.character) {
      this.tweens.killTweensOf(this.character);
      const groundY = this.getGroundYForLane(this.playerState.getLane());
      this.character.setPosition(CHARACTER_X, groundY);
      this.applyCharacterLanePresentation(this.playerState.getLane());
    }

    this.updateHud();
    this.updateProgressBar();
  }

  /** Leaves Boss Fight mode and resumes auto-run — used on defeat. */
  private exitBossFight(): void {
    this.inBossFight = false;
    this.bossFightController?.destroy();
    this.bossFightController = undefined;

    if (this.character) {
      this.character.y = this.getGroundYForLane(this.playerState.getLane());
      this.applyCharacterLanePresentation(this.playerState.getLane());
    }

    this.resumeWorld();
  }

  private triggerLevelComplete(): void {
    this.isComplete = true;
    this.pauseButton?.setVisible(false);
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();
    this.sfx.play("levelComplete");
    this.showResultsOverlay(this.time.now - this.attemptStartTimeMs);
  }

  private showResultsOverlay(completionTimeMs: number): void {
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    const title = this.add
      .text(width / 2, height / 2 - 70, "LEVEL COMPLETE", { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);
    const scoreLine = this.add
      .text(width / 2, height / 2 - 20, `Score (Coins): ${this.gameState.getScore()}`, {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    const timeLine = this.add
      .text(width / 2, height / 2 + 8, `Time: ${formatCompletionTime(completionTimeMs)}`, {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    const coinLine = this.add
      .text(width / 2, height / 2 + 36, `Coins: ${this.gameState.getCoinsCollected()}/${LEVEL.totalCoins}`, {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    const prompt = this.add
      .text(width / 2, height / 2 + 78, "Click or press any key to play again", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add.container(0, 0, [backdrop, title, scoreLine, timeLine, coinLine, prompt]);

    const restart = () => this.scene.restart();
    this.input.once("pointerdown", restart);
    this.input.keyboard?.once("keydown", restart);
  }
}

/** LEVEL's Checkpoint and Final Boss distances as an ascending queue for MarkerField — the Checkpoint always precedes the Boss (see Level.ts). */
function buildMarkerEvents(): MarkerEvent[] {
  return [
    { distance: LEVEL.checkpoint, kind: "checkpoint" },
    { distance: LEVEL.bossMarker, kind: "boss" },
  ];
}
