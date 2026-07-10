import Phaser from "phaser";
import { GameState } from "../game/GameState";
import { InputManager } from "../game/InputManager";
import { KeyboardAdapter } from "../game/KeyboardAdapter";
import { PlayerState, type PowerColor } from "../game/PlayerState";
import { ObstacleField } from "../game/ObstacleField";
import { CollectibleField } from "../game/CollectibleField";
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

/**
 * Two-lane dodge core loop: Left/Right switches Road/Lawn Lane independently
 * of Jump/Duck, which still clear Ground/Overhead Obstacles (spawned by
 * ObstacleField) in whichever Lane the player currently occupies. A miss
 * costs a Life, and 0 Lives shows a Game Over screen with restart. Hearts
 * and Coins (spawned by CollectibleField) restore Lives and add to a
 * completion count respectively. Clearing a Power-up Car grants a held
 * Power, which the activation input arms to destroy a matching Blocker
 * Obstacle on contact. Boss fights land in a later ticket.
 */
export class GameScene extends Phaser.Scene {
  readonly gameState = new GameState();
  private playerInput!: InputManager;
  private playerState!: PlayerState;
  private obstacleField!: ObstacleField;
  private collectibleField!: CollectibleField;
  private keyboardAdapter?: KeyboardAdapter;
  private background?: Phaser.GameObjects.TileSprite;
  private character?: Phaser.GameObjects.Container;
  private powerIndicator?: Phaser.GameObjects.Arc;
  private idleTween?: Phaser.Tweens.Tween;
  private powerExpiryTimer?: Phaser.Time.TimerEvent;
  private isGameOver = false;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.gameState.resetForNewAttempt();
    this.playerInput = new InputManager();
    this.playerState = new PlayerState();
    this.powerExpiryTimer?.remove();
    this.isGameOver = false;

    this.createBackgroundTexture();
    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, BACKGROUND_TEXTURE)
      .setOrigin(0, 0);

    this.character = this.createCharacterPlaceholder();

    this.obstacleField = new ObstacleField(this, {
      laneGroundY: (lane) => this.getGroundYForLane(lane),
      characterX: CHARACTER_X,
      scrollSpeed: SCROLL_SPEED,
      getPlayerPose: () => ({ lane: this.playerState.getLane(), verticalState: this.playerState.getState() }),
      getActivePower: () => (this.playerState.isPowerActivated() ? this.playerState.getPower() : null),
      onMissed: () => this.handleCollision(),
      onPowerCollected: (color) => this.handlePowerCollected(color),
      onBlockerDestroyed: () => this.playerState.clearPower(),
    });
    this.obstacleField.start();

    this.collectibleField = new CollectibleField(this, {
      laneGroundY: (lane) => this.getGroundYForLane(lane),
      characterX: CHARACTER_X,
      scrollSpeed: SCROLL_SPEED,
      getLane: () => this.playerState.getLane(),
      onHeartCollected: () => this.gameState.gainLife(),
      onCoinCollected: () => this.gameState.collectCoin(),
    });
    this.collectibleField.start();

    this.playerInput.on("jump", () => this.handleJump());
    this.playerInput.on("duck", () => this.handleDuck());
    this.playerInput.on("laneLeft", () => this.handleLaneSwitch());
    this.playerInput.on("laneRight", () => this.handleLaneSwitch());
    this.playerInput.on("powerActivate", () => this.handlePowerActivate());

    if (this.input.keyboard) {
      this.keyboardAdapter = new KeyboardAdapter(this.input.keyboard, this.playerInput);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboardAdapter?.destroy());
  }

  update(_time: number, delta: number): void {
    if (this.background) {
      this.background.tilePositionX += (SCROLL_SPEED * delta) / 1000;
    }
    if (this.isGameOver) return;
    this.updatePowerIndicator();
    this.obstacleField.update(delta);
    this.collectibleField.update(delta);
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

  private handlePowerCollected(color: PowerColor): void {
    this.playerState.collectPower(color);
    this.powerExpiryTimer?.remove();
    this.powerExpiryTimer = this.time.delayedCall(POWER_DURATION_MS, () => this.playerState.clearPower());
  }

  private handlePowerActivate(): void {
    if (this.isGameOver) return;
    this.playerState.activatePower();
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
    if (this.isGameOver || !this.character) return;
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
    if (this.isGameOver || !this.character) return;
    if (!this.playerState.duck()) return;

    this.idleTween?.pause();
    this.character.setScale(1, DUCK_SCALE_Y);
    this.time.delayedCall(DUCK_DURATION_MS, () => {
      this.character?.setScale(1, 1);
      this.finishPose(() => this.playerState.standUp());
    });
  }

  private handleLaneSwitch(): void {
    if (this.isGameOver || !this.character) return;

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
    if (this.gameState.isGameOver()) {
      this.triggerGameOver();
    }
  }

  private triggerGameOver(): void {
    this.isGameOver = true;
    this.idleTween?.pause();
    this.obstacleField.stop();
    this.collectibleField.stop();
    this.showGameOverOverlay();
  }

  private showGameOverOverlay(): void {
    const { width, height } = this.scale;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0.6);
    const title = this.add
      .text(width / 2, height / 2 - 20, "GAME OVER", { fontSize: "32px", color: "#ffffff" })
      .setOrigin(0.5);
    const prompt = this.add
      .text(width / 2, height / 2 + 24, "Click or press any key to restart", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.add.container(0, 0, [backdrop, title, prompt]);

    const restart = () => this.scene.restart();
    this.input.once("pointerdown", restart);
    this.input.keyboard?.once("keydown", restart);
  }
}
