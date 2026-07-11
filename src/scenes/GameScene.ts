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

const CHARACTER_X = 200;
const LAWN_Y_RATIO = 0.68; // top of the two lane bands (sky/lawn horizon)
const LANE_GAP = 55; // vertical distance between the Lawn and Road baselines
const SCROLL_SPEED = 220; // px/sec
const BACKGROUND_TEXTURE = "placeholder-background";
const BACKGROUND_TILE_WIDTH = 160;

const JUMP_HEIGHT = 90;
const JUMP_DURATION_MS = 420;
const DUCK_DURATION_MS = 500;
const DUCK_SCALE_Y = 0.55;
const LANE_SWITCH_DURATION_MS = 150;
const POWER_DURATION_MS = 5000;
const BOSS_X_OFFSET = 220; // distance right of Supa Dude the boss placeholder sits at

/**
 * Two-lane dodge core loop through the authored Level (see Level.ts,
 * ADR-0003): Left/Right switches Road/Lawn Lane independently of Jump/Duck,
 * which still clear Ground/Overhead Obstacles in whichever Lane the player
 * currently occupies. A miss costs a Life; 0 Lives respawns at the most
 * recent Checkpoint with Lives reset to 3 and the death recorded as Score
 * (see CONTEXT.md Attempt/Score) — there is no terminal "Game Over" in this
 * loop, only retries. Hearts and Coins restore Lives and add to a
 * completion count respectively. Clearing a Power-up Car grants a held
 * Power, which the activation input arms to destroy a matching Blocker
 * Obstacle on contact. Reaching the end of the Level shows a results screen
 * with Score and the Coin completion stat. Reaching the Final Boss marker
 * stops auto-run and hands off to BossFightController for the
 * dodge-and-riposte Boss Fight (CONTEXT.md) — a single climactic encounter
 * near the end of the Level, not several spread through it (ADR-0004).
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
  private background?: Phaser.GameObjects.TileSprite;
  private character?: Phaser.GameObjects.Container;
  private powerIndicator?: Phaser.GameObjects.Arc;
  private hudText?: Phaser.GameObjects.Text;
  private idleTween?: Phaser.Tweens.Tween;
  private powerExpiryTimer?: Phaser.Time.TimerEvent;
  private bossFightController?: BossFightController;
  private traveledDistance = 0;
  private attemptStartTimeMs = 0;
  private isComplete = false;
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
    this.powerExpiryTimer?.remove();
    this.bossFightController?.destroy();
    this.bossFightController = undefined;
    this.traveledDistance = 0;
    this.attemptStartTimeMs = this.time.now;
    this.isComplete = false;
    this.inBossFight = false;
    this.bossDefeated = false;

    this.createBackgroundTexture();
    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, BACKGROUND_TEXTURE)
      .setOrigin(0, 0);

    this.character = this.createCharacterPlaceholder();
    this.hudText = this.add.text(12, 12, "", { fontSize: "14px", color: "#ffffff" }).setDepth(10);
    this.updateHud();

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
        onBlockerDestroyed: () => this.playerState.clearPower(),
      },
      LEVEL.obstacles,
    );
    this.obstacleField.start();

    this.collectibleField = new CollectibleField(
      this,
      {
        laneGroundY: (lane) => this.getGroundYForLane(lane),
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
        getLane: () => this.playerState.getLane(),
        onHeartCollected: () => this.gameState.gainLife(),
        onCoinCollected: () => this.gameState.collectCoin(),
      },
      LEVEL.collectibles,
    );
    this.collectibleField.start();

    this.markerField = new MarkerField(
      this,
      {
        laneGroundY: (lane) => this.getGroundYForLane(lane),
        characterX: CHARACTER_X,
        scrollSpeed: SCROLL_SPEED,
      },
      buildMarkerEvents(),
    );
    this.markerField.start();

    this.playerInput.on("jump", () => this.handleJump());
    this.playerInput.on("duck", () => this.handleDuck());
    this.playerInput.on("laneLeft", () => this.handleLaneSwitch());
    this.playerInput.on("laneRight", () => this.handleLaneSwitch());
    this.playerInput.on("powerActivate", () => this.handlePowerActivate());
    this.playerInput.on("punch", () => this.handlePunch());

    if (this.input.keyboard) {
      this.keyboardAdapter = new KeyboardAdapter(this.input.keyboard, this.playerInput);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboardAdapter?.destroy());
  }

  update(_time: number, delta: number): void {
    if (this.isComplete) return;

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

  /** Road sits below Lawn on screen — the street is nearer the viewer than the sidewalk. */
  private getGroundYForLane(lane: Lane): number {
    const lawnY = this.scale.height * LAWN_Y_RATIO;
    return lane === "lawn" ? lawnY : lawnY + LANE_GAP;
  }

  /**
   * Generates a small repeating tile — sky, a Lawn strip, a curb, and a Road
   * strip below it, plus a fence-post landmark — rather than a full-screen
   * image, so tiling it across a TileSprite produces a visible, scrollable
   * pattern distinguishing the two Lanes.
   */
  private createBackgroundTexture(): void {
    const width = BACKGROUND_TILE_WIDTH;
    const height = this.scale.height;
    const lawnY = this.getGroundYForLane("lawn");
    const roadY = this.getGroundYForLane("road");

    const graphics = this.add.graphics();
    graphics.fillStyle(0x87ceeb, 1);
    graphics.fillRect(0, 0, width, lawnY);
    graphics.fillStyle(0x6b8e4e, 1);
    graphics.fillRect(0, lawnY, width, roadY - lawnY);
    graphics.fillStyle(0x4a4a4a, 1);
    graphics.fillRect(0, roadY, width, height - roadY);
    graphics.lineStyle(2, 0xd9d9d9, 1);
    graphics.lineBetween(0, roadY, width, roadY);

    graphics.fillStyle(0x8b5a2b, 1);
    graphics.fillRect(width - 6, lawnY - 30, 6, 30);

    graphics.generateTexture(BACKGROUND_TEXTURE, width, height);
    graphics.destroy();
  }

  private createCharacterPlaceholder(): Phaser.GameObjects.Container {
    const groundY = this.getGroundYForLane(this.playerState.getLane());

    const head = this.add.circle(0, -40, 12, 0x000000);
    const body = this.add.rectangle(0, -10, 6, 40, 0x000000);
    const cape = this.add.triangle(-4, -20, 0, -20, -10, 20, 4, 20, 0xd62828);
    this.powerIndicator = this.add.circle(0, -62, 8, 0xffffff, 0).setVisible(false);

    const character = this.add.container(CHARACTER_X, groundY, [cape, body, head, this.powerIndicator]);
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

  private handlePowerCollected(color: PowerColor): void {
    this.playerState.collectPower(color);
    this.powerExpiryTimer?.remove();
    this.powerExpiryTimer = this.time.delayedCall(POWER_DURATION_MS, () => this.playerState.clearPower());
  }

  private handlePowerActivate(): void {
    if (this.isComplete) return;
    this.playerState.activatePower();
  }

  /** Punch only ever does anything mid-Boss Fight, during the Vulnerable Window (CONTEXT.md Punch). */
  private handlePunch(): void {
    if (this.isComplete) return;
    this.bossFightController?.punch();
  }

  // A quick, slightly-tilting bounce reads as a running stride; final
  // sprite-sheet animation replaces this in the art-integration ticket.
  // Re-anchored on each Lane switch since the bounce's rest position is
  // baked in relative to whichever baseline was current when it started.
  private startIdleTween(character: Phaser.GameObjects.Container, baselineY: number): void {
    this.idleTween?.stop();
    this.idleTween = this.tweens.add({
      targets: character,
      y: baselineY - 14,
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
    if (this.isComplete || !this.character) return;
    if (!this.playerState.jump()) return;

    const groundY = this.getGroundYForLane(this.playerState.getLane());
    this.idleTween?.pause();
    this.tweens.add({
      targets: this.character,
      y: groundY - JUMP_HEIGHT,
      angle: 0,
      duration: JUMP_DURATION_MS / 2,
      yoyo: true,
      ease: "Sine.easeOut",
      onComplete: () => this.finishPose(() => this.playerState.land()),
    });
  }

  private handleDuck(): void {
    if (this.isComplete || !this.character) return;
    if (!this.playerState.duck()) return;

    this.idleTween?.pause();
    this.character.setScale(1, DUCK_SCALE_Y);
    this.time.delayedCall(DUCK_DURATION_MS, () => {
      this.character?.setScale(1, 1);
      this.finishPose(() => this.playerState.standUp());
    });
  }

  private handleLaneSwitch(): void {
    // Boss Fights aren't Lane-based (CONTEXT.md Boss Fight) — disabled so the
    // boss's fixed-position placeholder UI never desyncs from Supa Dude's row.
    if (this.isComplete || this.inBossFight || !this.character) return;

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
    this.gameState.loseLife();
    if (this.gameState.hasNoLivesLeft()) {
      this.respawnAtCheckpoint();
    }
  }

  /**
   * Reaching the Final Boss marker: stops auto-run and the
   * Obstacle/Collectible/Marker fields, hands off to a BossFightController.
   * Getting hit costs a Life via the same handleCollision as a normal
   * Obstacle — 0 Lives mid-fight respawns at the Checkpoint before the boss
   * exactly like any other death (see respawnAtCheckpoint).
   */
  private startBossFight(): void {
    this.inBossFight = true;
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();

    const groundY = this.getGroundYForLane(this.playerState.getLane());
    this.bossFightController = new BossFightController(this, {
      x: CHARACTER_X + BOSS_X_OFFSET,
      groundY,
      getPlayerState: () => this.playerState.getState(),
      onHit: () => this.handleCollision(),
      onDefeated: () => this.handleBossDefeated(),
    });
  }

  private handleBossDefeated(): void {
    this.bossDefeated = true;
    this.exitBossFight();
  }

  /** Leaves Boss Fight mode and resumes auto-run — used both on defeat and (implicitly) on a mid-fight Checkpoint respawn. */
  private exitBossFight(): void {
    this.inBossFight = false;
    this.bossFightController?.destroy();
    this.bossFightController = undefined;

    this.obstacleField.start();
    this.collectibleField.start();
    this.markerField.start();
    if (this.character) this.startIdleTween(this.character, this.getGroundYForLane(this.playerState.getLane()));
  }

  /**
   * 0 Lives mid-Level: respawn at the most recent Checkpoint with Lives
   * reset to 3 (see CONTEXT.md Checkpoint) rather than ending the Attempt —
   * the death is recorded as Score and the Level keeps going. If this
   * happened mid-Boss Fight, that fight is abandoned; traveled distance
   * rewinds to the Checkpoint immediately before the boss, so reaching the
   * marker again naturally restarts a fresh attempt at it.
   */
  private respawnAtCheckpoint(): void {
    this.gameState.respawnAtCheckpoint();

    if (this.inBossFight) this.exitBossFight();

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
      this.startIdleTween(this.character, groundY);
    }
  }

  private triggerLevelComplete(): void {
    this.isComplete = true;
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.markerField.stop();
    this.showResultsOverlay(this.time.now - this.attemptStartTimeMs);
  }

  private showResultsOverlay(completionTimeMs: number): void {
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    const title = this.add
      .text(width / 2, height / 2 - 70, "LEVEL COMPLETE", { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);
    const scoreLine = this.add
      .text(width / 2, height / 2 - 20, `Score (deaths): ${this.gameState.getScore()}`, {
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
