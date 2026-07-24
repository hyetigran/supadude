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
import type { Lane } from "../game/Lane";
import {
  BOSS_HEIGHT,
  DEPTH_BACKGROUND,
  DEPTH_HUD,
  DEPTH_PLAYER,
  DEPTH_SKY_DECOR,
  DUCK_SCALE_Y,
  IDLE_BOB_PX,
  JUMP_HEIGHT,
  LAWN_GRASS_HEIGHT,
  LAWN_GROUND_INSET_FROM_SIDEWALK_BOTTOM,
  LAWN_TOP_RATIO,
  PLAYER_BODY_HEIGHT,
  PLAYER_BODY_WIDTH,
  PLAYER_CAPE_COLOR,
  PLAYER_HEAD_RADIUS,
  PLAYER_STAND_HEIGHT,
  ROAD_GROUND_INSET,
  SIDEWALK_HEIGHT,
} from "../game/VisualScale";
import { PauseOverlay } from "./PauseOverlay";
import { Fx } from "./Fx";
import { Sfx } from "../game/Sfx";

const CHARACTER_X = 200;
const SCROLL_SPEED = 220; // px/sec
const BACKGROUND_TEXTURE = "placeholder-background";
const BACKGROUND_TILE_WIDTH = 160;

const JUMP_DURATION_MS = 420;
const DUCK_DURATION_MS = 500;
const LANE_SWITCH_DURATION_MS = 150;
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
const LAWN_COLOR = 0x6b8e4e;
const SIDEWALK_COLOR = 0xc4c4c0;
const CURB_COLOR = 0x9a9a96;
const ROAD_COLOR = 0x3f3f46;
const ROAD_DASH_COLOR = 0xfbbf24;
const FENCE_COLOR = 0x8b5a2b;
const ROAD_DASH_WIDTH = 28;
const ROAD_DASH_GAP = 22;
const ROAD_DASH_HEIGHT = 4;
const ROAD_DASH_BOTTOM_PAD = 14;

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
 * Two-lane dodge core loop through the authored Level (see Level.ts,
 * ADR-0003): Left/Right switches Road/Lawn Lane independently of Jump/Duck,
 * which still clear Ground/Overhead Obstacles in whichever Lane the player
 * currently occupies. A miss costs a Life; 0 Lives pauses for a continue
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

    const lawnTop = this.scale.height * LAWN_TOP_RATIO;
    this.createCloudsTexture(lawnTop);
    this.cloudsLayer = this.add
      .tileSprite(0, 0, this.scale.width, lawnTop, CLOUDS_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_SKY_DECOR);
    this.createSkylineTexture(lawnTop);
    this.skylineLayer = this.add
      .tileSprite(0, 0, this.scale.width, lawnTop, SKYLINE_TEXTURE)
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
        laneGroundY: (lane) => this.getGroundYForLane(lane),
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
        laneGroundY: (lane) => this.getGroundYForLane(lane),
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
        laneGroundY: (lane) => this.getGroundYForLane(lane),
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
      },
      buildMarkerEvents(),
    );

    this.playerInput.on("jump", () => this.handleJump());
    this.playerInput.on("duck", () => this.handleDuck());
    this.playerInput.on("laneLeft", () => this.handleLaneSwitch());
    this.playerInput.on("laneRight", () => this.handleLaneSwitch());
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

  /**
   * Feet sit inside each lane surface — Lawn on the sidewalk, Road inset into
   * the asphalt — not balanced on the top edge of the colored band.
   */
  private getGroundYForLane(lane: Lane): number {
    const lawnTop = this.scale.height * LAWN_TOP_RATIO;
    const sidewalkBottom = lawnTop + LAWN_GRASS_HEIGHT + SIDEWALK_HEIGHT;
    if (lane === "lawn") {
      return sidewalkBottom - LAWN_GROUND_INSET_FROM_SIDEWALK_BOTTOM;
    }
    return sidewalkBottom + ROAD_GROUND_INSET;
  }

  /**
   * Repeating neighborhood tile: sky, lawn grass, sidewalk, curb, road with
   * yellow dashes near the bottom, plus a fence-post landmark.
   */
  private createBackgroundTexture(): void {
    const width = BACKGROUND_TILE_WIDTH;
    const height = this.scale.height;
    const lawnTop = height * LAWN_TOP_RATIO;
    const sidewalkTop = lawnTop + LAWN_GRASS_HEIGHT;
    const roadTop = sidewalkTop + SIDEWALK_HEIGHT;

    const graphics = this.add.graphics();

    // Sky
    graphics.fillStyle(SKY_COLOR, 1);
    graphics.fillRect(0, 0, width, lawnTop);

    // Lawn grass
    graphics.fillStyle(LAWN_COLOR, 1);
    graphics.fillRect(0, lawnTop, width, LAWN_GRASS_HEIGHT);

    // Sidewalk
    graphics.fillStyle(SIDEWALK_COLOR, 1);
    graphics.fillRect(0, sidewalkTop, width, SIDEWALK_HEIGHT);
    graphics.lineStyle(1, CURB_COLOR, 1);
    graphics.lineBetween(0, sidewalkTop, width, sidewalkTop);
    graphics.lineBetween(0, roadTop, width, roadTop);

    // Road
    graphics.fillStyle(ROAD_COLOR, 1);
    graphics.fillRect(0, roadTop, width, height - roadTop);

    // Yellow dashes along the bottom of the road
    const dashY = height - ROAD_DASH_BOTTOM_PAD - ROAD_DASH_HEIGHT;
    graphics.fillStyle(ROAD_DASH_COLOR, 1);
    for (let x = 8; x < width; x += ROAD_DASH_WIDTH + ROAD_DASH_GAP) {
      graphics.fillRect(x, dashY, ROAD_DASH_WIDTH, ROAD_DASH_HEIGHT);
    }

    // Fence post landmark on the lawn
    graphics.fillStyle(FENCE_COLOR, 1);
    graphics.fillRect(width - 6, sidewalkTop - 34, 6, 34);

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

  /** Distant rooftop silhouette sitting just above the lawn line, faster than clouds but still slower than the foreground (see SKYLINE_PARALLAX_FACTOR). */
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
    const groundY = this.getGroundYForLane(this.playerState.getLane());

    // Feet at local y=0 so the container sits on the lane baseline and duck
    // squash (scaleY) contracts toward the ground rather than through it.
    const body = this.add.rectangle(0, 0, PLAYER_BODY_WIDTH, PLAYER_BODY_HEIGHT, 0x000000).setOrigin(0.5, 1);
    const headY = -(PLAYER_BODY_HEIGHT + PLAYER_HEAD_RADIUS);
    const head = this.add.circle(0, headY, PLAYER_HEAD_RADIUS, 0x000000);
    const cape = this.add.triangle(-4, -PLAYER_BODY_HEIGHT * 0.5, 0, -PLAYER_BODY_HEIGHT * 0.55, -10, 0, 4, 0, PLAYER_CAPE_COLOR);
    this.powerIndicator = this.add.circle(0, -(PLAYER_STAND_HEIGHT + 8), 8, 0xffffff, 0).setVisible(false);

    const character = this.add.container(CHARACTER_X, groundY, [cape, body, head, this.powerIndicator]);
    character.setDepth(DEPTH_PLAYER);
    this.startIdleTween(character, groundY);

    return character;
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
    this.fx.burst(CHARACTER_X + BOSS_X_OFFSET, this.getGroundYForLane("road") - BOSS_HEIGHT * 0.5, BOSS_HIT_BURST_COLOR, {
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
    this.bossFightController?.punch();
  }

  private charX(): number {
    return this.character?.x ?? CHARACTER_X;
  }

  private charY(): number {
    return this.character?.y ?? this.getGroundYForLane(this.playerState.getLane());
  }

  // A quick, slightly-tilting bounce reads as a running stride; final
  // sprite-sheet animation replaces this in the art-integration ticket.
  // Re-anchored on each Lane switch since the bounce's rest position is
  // baked in relative to whichever baseline was current when it started.
  // Paused during Jump/Duck so idle bob never fights overhead clearance.
  private startIdleTween(character: Phaser.GameObjects.Container, baselineY: number): void {
    this.idleTween?.stop();
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
      this.startIdleTween(this.character, this.getGroundYForLane(this.playerState.getLane()));
    }
  }

  private handleJump(): void {
    if (this.isComplete || this.isPaused || !this.character) return;
    if (!this.playerState.jump()) return;

    this.sfx.play("jump");
    const groundY = this.getGroundYForLane(this.playerState.getLane());
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
    // Squash toward feet (local y=0) — reads as a crouch under Overhead Obstacles.
    this.idleTween?.pause();
    this.character.setScale(1, DUCK_SCALE_Y);
    this.character.y = this.getGroundYForLane(this.playerState.getLane());
    this.time.delayedCall(DUCK_DURATION_MS, () => {
      this.character?.setScale(1, 1);
      this.finishPose(() => this.playerState.standUp());
    });
  }

  private handleLaneSwitch(): void {
    // Boss Fights aren't Lane-based (CONTEXT.md Boss Fight) — disabled so the
    // boss's fixed-position placeholder UI never desyncs from Supa Dude's row.
    if (this.isComplete || this.isPaused || this.inBossFight || !this.character) return;

    this.sfx.play("laneSwitch");
    this.playerState.switchLane();
    // Jump/duck already have their own y target baked into their in-flight
    // tween/timer; switching mid-pose updates the Lane immediately (so
    // collision resolution is always correct) but the visual re-anchor
    // happens on the next finishPose, not mid-animation.
    if (this.playerState.getState() !== "grounded") return;

    const newGroundY = this.getGroundYForLane(this.playerState.getLane());
    this.idleTween?.pause();
    this.tweens.add({
      targets: this.character,
      y: newGroundY,
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
      this.character.setScale(1, 1);
      this.character.setAngle(0);
      this.character.y = this.getGroundYForLane(this.playerState.getLane());
    }
    this.playerState.land();
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
   * Boss is pinned to the Road baseline so the fight reads as a fixed arena
   * regardless of which Lane the player arrived on.
   */
  private startBossFight(): void {
    this.inBossFight = true;
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();

    // Snap Supa Dude onto the Road arena row for the fight.
    const arenaY = this.getGroundYForLane("road");
    if (this.character) {
      this.tweens.killTweensOf(this.character);
      this.character.setScale(1, 1);
      this.character.setPosition(CHARACTER_X, arenaY);
    }
    if (this.playerState.getLane() !== "road") {
      this.playerState.switchLane();
    }

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
    this.fx.burst(CHARACTER_X + BOSS_X_OFFSET, this.getGroundYForLane("road") - BOSS_HEIGHT * 0.5, BOSS_DEFEAT_BURST_COLOR, {
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

    this.playerState.clearPower();
    this.powerExpiryTimer?.remove();
    this.playerState.land();

    if (this.character) {
      this.tweens.killTweensOf(this.character);
      this.character.setScale(1, 1);
      const groundY = this.getGroundYForLane(this.playerState.getLane());
      this.character.setPosition(CHARACTER_X, groundY);
    }

    this.updateHud();
    this.updateProgressBar();
  }

  /** Leaves Boss Fight mode and resumes auto-run — used on defeat. */
  private exitBossFight(): void {
    this.inBossFight = false;
    this.bossFightController?.destroy();
    this.bossFightController = undefined;

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
