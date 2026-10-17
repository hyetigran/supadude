import { VIEWPORT, RENDER_SCALE } from "../game/Viewport";
import { TouchControls } from "../game/TouchControls";
import Phaser from "phaser";
import { CollectibleField } from "../game/CollectibleField";
import { InputManager } from "../game/InputManager";
import { KeyboardAdapter } from "../game/KeyboardAdapter";
import { type Level } from "../game/Level";
import { defaultQASettings, qaLevel, qaTuning } from "../game/QASettings";
import { BattleField } from "../game/BattleField";
import { QAPanel } from "./QAPanel";
import { ObstacleField } from "../game/ObstacleField";
import { type Difficulty } from "../game/Difficulty";
import { Runner, type RunnerEvent, type RunnerFrame } from "../game/Runner";
import { Sfx } from "../game/Sfx";
import {
  DEPTH_BACKGROUND,
  DEPTH_HUD,
  DEPTH_PLAYER,
  DEPTH_SCENERY,
  PLAYER_SHADOW_HEIGHT,
  PLAYER_SHADOW_WIDTH,
  PLAYER_SIZE,
  groundYForViewport,
} from "../game/VisualScale";
import { formatCompletionTime } from "../game/formatCompletionTime";
import { Fx } from "./Fx";
import { PauseOverlay } from "./PauseOverlay";

const CHARACTER_X = 180;
const BACKGROUND_TEXTURE = "neighborhood-road";
const SCENERY_TEXTURE = "neighborhood-houses";
const TEXTURE_WIDTH = 960;

const SKY_COLOR = 0xd7eaf0;
const TRACK_EDGE_COLOR = 0xf4c76b;
const PLAYER_COLOR = 0x38bdf8;
const PLAYER_INSET_COLOR = 0x172554;
const PLAYER_OUTLINE_COLOR = 0xf8fafc;
const PLAYER_CAPE_COLOR = 0xef4444;
const PLAYER_EMBLEM_COLOR = 0xfacc15;
const PLAYER_SHADOW_COLOR = 0x020617;
const COIN_BURST_COLOR = 0xffd166;
const DEATH_BURST_COLOR = 0xff4d8d;
const RESTART_BURST_COLOR = 0x67e8f9;

const HUD_COLOR = 0x0f172a;
const HUD_TEXT_COLOR = "#f8fafc";
const HUD_FONT = "Arial, Helvetica, sans-serif";
const TEXT_RESOLUTION = typeof window === "undefined" ? 1 : Math.min(window.devicePixelRatio || 1, 2);
const PROGRESS_HEIGHT = 7;
const PAUSE_BUTTON_SIZE = 44;
const PAUSE_BUTTON_PAD = 12;

/**
 * Single-plane auto-runner with jumping and optional powered shooting. Runner owns every gameplay decision;
 * this Scene translates keyboard/pointer input into held Jump state and turns
 * immutable RunnerFrame snapshots into Phaser presentation.
 */
export class GameScene extends Phaser.Scene {
  private qaSettings = defaultQASettings();
  private level!: Level;
  private readonly qaPanel = new QAPanel();
  private qaOpen = false;
  private qaButton?: Phaser.GameObjects.Text;
  private difficulty: Difficulty = "normal";
  private runner!: Runner;
  private frame!: RunnerFrame;
  private playerInput!: InputManager;
  private touchControls?: TouchControls;
  private keyboardAdapter?: KeyboardAdapter;
  private battleField!: BattleField;
  private obstacleField!: ObstacleField;
  private collectibleField!: CollectibleField;
  private pauseOverlay!: PauseOverlay;
  private fx!: Fx;
  private readonly sfx = new Sfx();

  private background?: Phaser.GameObjects.TileSprite;
  private scenery?: Phaser.GameObjects.TileSprite;
  private player?: Phaser.GameObjects.Container;
  private powerAura?: Phaser.GameObjects.Arc;
  private carPowerText?: Phaser.GameObjects.Text;
  private playerShadow?: Phaser.GameObjects.Ellipse;
  private hudPanel?: Phaser.GameObjects.Rectangle;
  private hudText?: Phaser.GameObjects.Text;
  private progressFill?: Phaser.GameObjects.Rectangle;
  private abilityText?: Phaser.GameObjects.Text;
  private pauseButton?: Phaser.GameObjects.Container;

  private groundY = 0;
  private isPaused = true;
  private isComplete = false;
  private reducedMotion = false;

  private readonly handlePointerDown = (pointer: Phaser.Input.Pointer): void =>
    this.playerInput.press("jump", `pointer-${pointer.id}`);
  private readonly handlePointerUp = (pointer: Phaser.Input.Pointer): void =>
    this.playerInput.release("jump", `pointer-${pointer.id}`);

  constructor() {
    super("GameScene");
  }

  create(data: { autoStart?: boolean; practiceBattle?: 0.5 | 0.9 } = {}): void {
    this.cameras.main.setOrigin(0, 0).setZoom(RENDER_SCALE);
    this.qaOpen = false;
    this.level = qaLevel(this.qaSettings);
    this.runner = new Runner(this.level);
    this.frame = this.runner.step(0, { jumpHeld: false });
    this.playerInput = new InputManager();
    this.touchControls = new TouchControls(this.playerInput, this.game.canvas);
    this.pauseOverlay = new PauseOverlay(this);
    this.fx = new Fx(this);
    this.groundY = groundYForViewport(VIEWPORT.height);
    this.isPaused = true;
    this.isComplete = false;
    this.reducedMotion =
      typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    this.createBackgroundTexture();
    this.createSceneryTexture();
    this.background = this.add
      .tileSprite(0, 0, VIEWPORT.width, VIEWPORT.height, BACKGROUND_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_BACKGROUND);
    this.scenery = this.add
      .tileSprite(0, 0, VIEWPORT.width, VIEWPORT.height, SCENERY_TEXTURE)
      .setOrigin(0, 0)
      .setDepth(DEPTH_SCENERY);

    this.battleField = new BattleField(this, this.groundY);
    this.obstacleField = new ObstacleField(this, this.groundY, CHARACTER_X, this.level);
    this.collectibleField = new CollectibleField(this, this.groundY, CHARACTER_X, this.level.coins, this.reducedMotion);
    this.player = this.createPlayerIcon();
    this.powerAura = this.add.circle(CHARACTER_X, this.groundY, 27, 0xef4444, 0.16)
      .setStrokeStyle(3, 0xef4444, 0.9).setDepth(DEPTH_PLAYER - 0.1).setVisible(false);
    this.playerShadow = this.add
      .ellipse(CHARACTER_X, this.groundY + 3, PLAYER_SHADOW_WIDTH, PLAYER_SHADOW_HEIGHT, PLAYER_SHADOW_COLOR, 0.42)
      .setDepth(DEPTH_PLAYER - 0.5);

    this.createHud();
    this.pauseButton = this.createPauseButton();
    this.qaButton = this.add.text(VIEWPORT.width - 112, 14, "QA", {
      fontFamily: HUD_FONT, fontSize: "18px", color: "#ffffff", backgroundColor: "#245764", padding: { x: 12, y: 10 },
    }).setDepth(DEPTH_HUD + 30).setInteractive({ useHandCursor: true });
    this.qaButton.on("pointerdown", (_p: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation(); this.openQA();
    });
    this.input.addPointer(1);
    this.renderFrame(this.frame);

    this.playerInput.on("pause", () => this.handlePause());
    if (this.input.keyboard) this.keyboardAdapter = new KeyboardAdapter(this.input.keyboard, this.playerInput);

    this.input.on("pointerdown", this.handlePointerDown);
    this.input.on("pointerup", this.handlePointerUp);
    this.input.on("pointerupoutside", this.handlePointerUp);

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.pauseOverlay.destroy();
      this.qaPanel.destroy();
      this.keyboardAdapter?.destroy();
      this.touchControls?.destroy();
      this.input.off("pointerdown", this.handlePointerDown);
      this.input.off("pointerup", this.handlePointerUp);
      this.input.off("pointerupoutside", this.handlePointerUp);
    });

    if (data.autoStart) this.beginPlay(this.difficulty, data.practiceBattle);
    else this.pauseOverlay.show("start", (difficulty) => this.beginPlay(difficulty ?? "normal"));
  }

  update(_time: number, delta: number): void {
    this.touchControls?.update(!this.isPaused && !this.isComplete && this.frame.phase === "running", !!this.frame.battle, this.frame.carPower);
    if (this.isPaused || this.isComplete) return;

    const upPressed = this.playerInput.consumePress("up");
    this.frame = this.runner.step(delta, {
      moveX: Number(this.playerInput.isHeld("right")) - Number(this.playerInput.isHeld("left")),
      jumpHeld: this.playerInput.isHeld("jump") || (!this.frame.battle && this.playerInput.isHeld("up")),
      jumpPressed: this.playerInput.consumePress("jump") || (!this.frame.battle && upPressed),
      shootPressed: this.playerInput.consumePress("shoot"),
    });

    for (const event of this.frame.events) this.handleRunnerEvent(event);
    this.renderFrame(this.frame);
  }

  private handleRunnerEvent(event: RunnerEvent): void {
    switch (event.type) {
      case "carPowerStarted":
        this.sfx.play("orb");
        this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, event.power === "fire" ? 0xf97316 : event.power === "water" ? 0x38bdf8 : 0xfacc15,
          { count: 14, lifespanMs: 360, speedMax: 120 });
        return;
      case "shotFired": {
        const color = event.power === "fire" ? 0xf97316 : event.power === "water" ? 0x38bdf8 : 0xfacc15;
        const targetX = CHARACTER_X + event.targetX - this.frame.distance;
        const targetY = this.groundY - event.targetY;
        const blast = this.add.graphics().setDepth(DEPTH_PLAYER + 1);
        blast.lineStyle(7, color, 0.75);
        blast.lineBetween(CHARACTER_X, this.groundY - this.frame.altitude - PLAYER_SIZE / 2, targetX, targetY);
        blast.lineStyle(2, 0xffffff, 0.9);
        blast.lineBetween(CHARACTER_X, this.groundY - this.frame.altitude - PLAYER_SIZE / 2, targetX, targetY);
        this.tweens.add({ targets: blast, alpha: 0, duration: 160, onComplete: () => blast.destroy() });
        this.sfx.play("orb");
        return;
      }
      case "battleStarted":
      case "battleWon":
        this.playerInput.clearAll();
        this.sfx.play("orb");
        return;
      case "hazardCleared": {
        const hazard = this.level.hazards.find(({ id }) => id === event.hazardId);
        if (hazard) this.fx.burst(CHARACTER_X + hazard.x - this.frame.distance,
          this.groundY - hazard.height / 2, event.power === "fire" ? 0xf97316 : event.power === "water" ? 0x38bdf8 : 0xfacc15,
          { count: 12, lifespanMs: 300, speedMax: 130, gravityY: 100 });
        return;
      }
      case "carPowerEnded":
        return;
      case "flightStarted":
      case "orbActivated":
        this.sfx.play(event.type === "flightStarted" ? "flight" : "orb");
        this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, event.type === "flightStarted" ? 0x22d3ee : 0xfbbf24, {
          count: 16, lifespanMs: 420, speedMax: 140,
        });
        return;
      case "flightEnded":
        this.sfx.play("land");
        return;
      case "jumped":
        this.sfx.play("jump");
        return;
      case "landed":
        this.sfx.play("land");
        this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, TRACK_EDGE_COLOR, {
          count: 4,
          lifespanMs: 180,
          speedMax: 55,
          gravityY: 80,
        });
        return;
      case "died":
        this.sfx.play("hit");
        this.fx.shake(180, 0.012);
        this.fx.flash(DEATH_BURST_COLOR, 110);
        this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, DEATH_BURST_COLOR, {
          count: 18,
          lifespanMs: 420,
          speedMax: 230,
        });
        return;
      case "restarted":
        this.collectibleField.reset();
        this.fx.burst(CHARACTER_X, this.groundY - PLAYER_SIZE / 2, RESTART_BURST_COLOR, {
          count: 8,
          lifespanMs: 240,
          speedMax: 90,
        });
        return;
      case "coinCollected":
        this.collectibleField.collect(event.coinId);
        this.sfx.play("coin");
        this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, COIN_BURST_COLOR, {
          count: 7,
          lifespanMs: 260,
          speedMax: 110,
        });
        return;
      case "completed":
        this.completeLevel();
        return;
    }
  }

  private renderFrame(frame: RunnerFrame): void {
    const playerVisible = frame.phase !== "dead";
    const playerX = frame.battle?.playerX ?? CHARACTER_X;
    const feetY = this.groundY + (frame.battle?.playerY ?? 0);
    const altitude = frame.battle?.jumpHeight ?? frame.altitude;
    if (this.player) {
      this.player
        .setPosition(playerX, feetY - PLAYER_SIZE / 2 - altitude)
        .setAlpha(frame.battle?.invulnerable ? 0.55 : 1)
        .setAngle(frame.battle ? 0 : frame.flightRemainingMs > 0 ? -12 : this.reducedMotion ? 0 : frame.rotation)
        .setVisible(playerVisible);
    }

    const powerColor = frame.carPower === "fire" ? 0xf97316 : frame.carPower === "water" ? 0x38bdf8 : 0xfacc15;
    this.powerAura?.setPosition(playerX, feetY - PLAYER_SIZE / 2 - altitude)
      .setFillStyle(powerColor, 0.16).setStrokeStyle(3, powerColor, 0.9)
      .setVisible(playerVisible && frame.carPower !== null);

    if (this.playerShadow) {
      const shadowScale = Phaser.Math.Clamp(1 - altitude / 180, 0.42, 1);
      const restingSurface = !frame.battle && frame.grounded ? frame.altitude : 0;
      this.playerShadow
        .setPosition(playerX, feetY - restingSurface + 3)
        .setScale(shadowScale, shadowScale)
        .setAlpha(playerVisible ? 0.18 + shadowScale * 0.24 : 0)
        .setVisible(playerVisible);
    }

    if (this.background) this.background.tilePositionX = frame.distance;
    if (this.scenery) this.scenery.tilePositionX = frame.distance * (this.reducedMotion ? 1 : 0.24);
    this.obstacleField.render(frame);
    this.collectibleField.render(frame.distance, !frame.battle);
    this.battleField.render(frame.battle, frame.carPower, frame.phase === "dead");
    this.updateHud(frame);
  }

  private createBackgroundTexture(): void {
    if (this.textures.exists(BACKGROUND_TEXTURE)) return;
    const g = this.add.graphics();
    g.fillStyle(SKY_COLOR); g.fillRect(0, 0, TEXTURE_WIDTH, VIEWPORT.height);
    g.fillStyle(0xa8c58b); g.fillRect(0, this.groundY - 35, TEXTURE_WIDTH, 35);
    g.fillStyle(0xc8c2af); g.fillRect(0, this.groundY - 14, TEXTURE_WIDTH, 14);
    g.fillStyle(0x58636c); g.fillRect(0, this.groundY, TEXTURE_WIDTH, VIEWPORT.height - this.groundY);
    g.fillStyle(0xf2e2b8); g.fillRect(0, this.groundY, TEXTURE_WIDTH, 4);
    g.lineStyle(1, 0x9d998c);
    for (let x = 0; x < TEXTURE_WIDTH; x += 64) g.lineBetween(x, this.groundY - 14, x + 10, this.groundY);
    g.fillStyle(0xecc46a);
    for (let x = 0; x < TEXTURE_WIDTH; x += 120) g.fillRoundedRect(x, this.groundY + 46, 62, 3, 1);
    g.generateTexture(BACKGROUND_TEXTURE, TEXTURE_WIDTH, VIEWPORT.height); g.destroy();
  }

  private createSceneryTexture(): void {
    if (this.textures.exists(SCENERY_TEXTURE)) return;
    const g = this.add.graphics();
    // Quiet, warm houses sit behind the sidewalk; interactive obstacles have darker outlines.
    g.fillStyle(0xffffff, 0.75);
    for (const [x, y] of [[70, 78], [390, 112], [730, 72]]) {
      g.fillEllipse(x, y, 86, 22); g.fillEllipse(x + 24, y - 9, 57, 28);
    }
    const houses = [
      { x: 22, w: 150, h: 114, color: 0xdab998, roof: 0x986c63 },
      { x: 247, w: 154, h: 138, color: 0xa8bbc0, roof: 0x687d86 },
      { x: 489, w: 142, h: 103, color: 0xdecda4, roof: 0x9c8770 },
      { x: 731, w: 166, h: 130, color: 0xc3b3bd, roof: 0x827684 },
    ];
    const base = this.groundY - 29;
    for (const house of houses) {
      const top = base - house.h;
      g.fillStyle(house.color); g.fillRect(house.x, top, house.w, house.h);
      g.fillStyle(house.roof); g.fillTriangle(house.x - 12, top, house.x + house.w / 2, top - 50, house.x + house.w + 12, top);
      g.fillRect(house.x + house.w - 30, top - 43, 15, 36);
      g.lineStyle(1, 0xffffff, 0.3);
      for (let y = top + 8; y < base; y += 10) g.lineBetween(house.x, y, house.x + house.w, y);
      g.fillStyle(0x677e87); g.fillRoundedRect(house.x + house.w / 2 - 13, base - 47, 26, 47, 3);
      for (const x of [house.x + 20, house.x + house.w - 46]) {
        g.fillStyle(0xffedba); g.fillRect(x, top + 23, 27, 33);
        g.lineStyle(3, 0xf6eddf); g.strokeRect(x, top + 23, 27, 33);
        g.lineBetween(x + 13, top + 23, x + 13, top + 56); g.lineBetween(x, top + 39, x + 27, top + 39);
      }
      g.fillStyle(0xe7dfcf); g.fillRect(house.x + house.w / 2 - 19, base, 38, 15);
      const treeX = house.x + house.w + 25;
      g.fillStyle(0x967e62); g.fillRect(treeX - 4, base - 81, 9, 81);
      g.fillStyle(0x8caf79); g.fillCircle(treeX, base - 88, 28); g.fillCircle(treeX - 14, base - 67, 23);
      g.fillStyle(0xf5edd8); for (let x = house.x - 10; x < house.x + 50; x += 12) g.fillRoundedRect(x, base - 17, 7, 31, 2);
      g.fillRect(house.x - 10, base - 7, 60, 4);
      // Mailboxes and driveways make the backdrop read as a neighborhood.
      g.fillStyle(0x8e7966); g.fillRect(house.x + house.w - 5, base - 20, 4, 29);
      g.fillStyle(0x77929a); g.fillRoundedRect(house.x + house.w - 13, base - 30, 24, 13, 4);
    }
    g.generateTexture(SCENERY_TEXTURE, TEXTURE_WIDTH, VIEWPORT.height); g.destroy();
  }

  private createPlayerIcon(): Phaser.GameObjects.Container {
    const cape = this.add
      .triangle(-PLAYER_SIZE * 0.44, 5, 0, -12, -18, 4, 0, 15, PLAYER_CAPE_COLOR)
      .setStrokeStyle(2, PLAYER_OUTLINE_COLOR, 0.85);
    const body = this.add
      .rectangle(0, 0, PLAYER_SIZE, PLAYER_SIZE, PLAYER_COLOR)
      .setStrokeStyle(3, PLAYER_OUTLINE_COLOR, 1);
    const inset = this.add
      .rectangle(0, 1, PLAYER_SIZE - 13, PLAYER_SIZE - 13, PLAYER_INSET_COLOR)
      .setStrokeStyle(2, PLAYER_COLOR, 0.9);
    const eyeLeft = this.add.rectangle(-6, -5, 4, 7, PLAYER_OUTLINE_COLOR);
    const eyeRight = this.add.rectangle(6, -5, 4, 7, PLAYER_OUTLINE_COLOR);
    const emblem = this.add
      .polygon(0, 8, [0, -6, 6, 0, 0, 7, -6, 0], PLAYER_EMBLEM_COLOR)
      .setStrokeStyle(1, PLAYER_OUTLINE_COLOR, 0.8);

    return this.add
      .container(CHARACTER_X, this.groundY - PLAYER_SIZE / 2, [cape, body, inset, eyeLeft, eyeRight, emblem])
      .setDepth(DEPTH_PLAYER);
  }

  private createHud(): void {
    this.hudPanel = this.add
      .rectangle(8, 8, 312, 38, HUD_COLOR, 0.9)
      .setOrigin(0, 0)
      .setStrokeStyle(1, 0xffffff, 0.18)
      .setDepth(DEPTH_HUD);
    this.hudText = this.add
      .text(20, 27, "", {
        fontFamily: HUD_FONT,
        fontSize: "15px",
        fontStyle: "bold",
        color: HUD_TEXT_COLOR,
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0, 0.5)
      .setDepth(DEPTH_HUD + 1);

    this.abilityText = this.add.text(VIEWPORT.width / 2, 62, "", {
      fontFamily: HUD_FONT, fontSize: "14px", fontStyle: "bold", color: "#075985", backgroundColor: "#ecfeff",
      padding: { x: 12, y: 7 }, resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(DEPTH_HUD + 1);
    this.carPowerText = this.add.text(VIEWPORT.width / 2, 62, "", {
      fontFamily: HUD_FONT, fontSize: "13px", fontStyle: "bold", color: "#991b1b", backgroundColor: "#fff7ed",
      padding: { x: 12, y: 7 }, resolution: TEXT_RESOLUTION,
    }).setOrigin(0.5).setDepth(DEPTH_HUD + 1);
    const y = VIEWPORT.height - PROGRESS_HEIGHT;
    this.add
      .rectangle(0, y, VIEWPORT.width, PROGRESS_HEIGHT, 0x020617, 0.72)
      .setOrigin(0, 0)
      .setDepth(DEPTH_HUD);
    this.progressFill = this.add
      .rectangle(0, y, 0, PROGRESS_HEIGHT, TRACK_EDGE_COLOR)
      .setOrigin(0, 0)
      .setDepth(DEPTH_HUD + 1);
  }

  private updateHud(frame: RunnerFrame): void {
    const flying = frame.flightRemainingMs > 0;
    this.abilityText?.setVisible(flying).setText(`FLIGHT ${(frame.flightRemainingMs / 1000).toFixed(1)}s  ·  HOLD TO RISE / RELEASE TO DESCEND`);
    this.carPowerText?.setVisible(frame.carPower !== null && frame.phase !== "dead")
      .setY(flying ? 99 : 62)
      .setColor(frame.carPower === "fire" ? "#991b1b" : frame.carPower === "water" ? "#1e40af" : "#854d0e")
      .setText(`${frame.carPower?.toUpperCase() ?? ""} ${(frame.carPowerRemainingMs / 1000).toFixed(1)}s  ·  ${frame.carPower === "fire" ? "F / X: BURN BUSHES" : frame.carPower === "water" ? "F / X: CLEAR TRASH CANS" : "F / X: ZAP HYDRANTS"}`);
    const percent = Math.floor(frame.progress * 100);
    const text = `${this.difficulty.toUpperCase()}    ATTEMPT ${frame.attempt}    ${percent}%    COINS ${frame.coinsCollected}/${this.level.totalCoins}`;
    if (this.hudText && this.hudText.text !== text) {
      this.hudText.setText(text);
      this.hudPanel?.setSize(this.hudText.width + 24, 38);
    }
    this.progressFill?.setSize(VIEWPORT.width * frame.progress, PROGRESS_HEIGHT);
  }

  private createPauseButton(): Phaser.GameObjects.Container {
    const x = VIEWPORT.width - PAUSE_BUTTON_PAD - PAUSE_BUTTON_SIZE / 2;
    const y = PAUSE_BUTTON_PAD + PAUSE_BUTTON_SIZE / 2;
    const background = this.add
      .rectangle(0, 0, PAUSE_BUTTON_SIZE, PAUSE_BUTTON_SIZE, HUD_COLOR, 0.9)
      .setStrokeStyle(1, 0xffffff, 0.2);
    const left = this.add.rectangle(-5, 0, 5, 17, PLAYER_OUTLINE_COLOR);
    const right = this.add.rectangle(5, 0, 5, 17, PLAYER_OUTLINE_COLOR);
    const hit = this.add
      .zone(0, 0, PAUSE_BUTTON_SIZE, PAUSE_BUTTON_SIZE)
      .setOrigin(0.5)
      .setInteractive({ useHandCursor: true });
    hit.on("pointerdown", (_pointer: Phaser.Input.Pointer, _x: number, _y: number, event: Phaser.Types.Input.EventData) => {
      event.stopPropagation();
      this.handlePause();
    });
    return this.add.container(x, y, [background, left, right, hit]).setDepth(DEPTH_HUD + 2).setVisible(false);
  }

  private beginPlay(difficulty: Difficulty, practiceBattle?: 0.5 | 0.9): void {
    this.difficulty = difficulty;
    this.runner = new Runner(this.level, qaTuning(this.qaSettings, difficulty), practiceBattle);
    this.frame = this.runner.step(0, { jumpHeld: false });
    this.playerInput.clearAll();
    this.renderFrame(this.frame);
    this.isPaused = false;
    this.pauseButton?.setVisible(true);
  }

  private handlePause(): void {
    if (this.isPaused || this.isComplete || this.qaOpen) return;
    this.isPaused = true;
    this.playerInput.clearAll();
    this.sfx.play("pause");
    this.pauseButton?.setVisible(false);
    this.pauseOverlay.show("pause", () => {
      // The click/Space used to dismiss Pause is a UI gesture, not a Jump.
      this.playerInput.clearAll();
      this.isPaused = false;
      this.pauseButton?.setVisible(true);
    }, () => this.scene.restart({ autoStart: false }));
  }

  private openQA(): void {
    if (this.qaOpen || this.isComplete) return;
    const wasPaused = this.isPaused;
    const wasMenu = wasPaused && this.frame.attemptElapsedMs === 0;
    this.qaOpen = true;
    this.isPaused = true;
    this.playerInput.clearAll();
    this.pauseOverlay.destroy();
    this.qaPanel.show(this.qaSettings, (settings, practiceBattle) => {
      this.qaSettings = settings;
      this.qaOpen = false;
      this.scene.restart({ autoStart: true, practiceBattle });
    }, () => {
      this.qaOpen = false;
      this.playerInput.clearAll();
      if (wasMenu) this.pauseOverlay.show("start", (difficulty) => this.beginPlay(difficulty ?? "normal"));
      else {
        this.isPaused = false;
        if (wasPaused) this.handlePause();
      }
    });
  }

  private completeLevel(): void {
    if (this.isComplete) return;
    this.isComplete = true;
    this.qaButton?.setVisible(false);
    this.pauseButton?.setVisible(false);
    this.sfx.play("levelComplete");
    this.fx.burst(CHARACTER_X, this.player?.y ?? this.groundY, 0x4ade80, {
      count: 28,
      lifespanMs: 620,
      speedMax: 260,
    });
    this.showResultsOverlay();
  }

  private showResultsOverlay(): void {
    const { width, height } = VIEWPORT;
    const backdrop = this.add.rectangle(width / 2, height / 2, width, height, 0x020617, 0.68);
    const panel = this.add
      .rectangle(width / 2, height / 2, 460, 280, HUD_COLOR, 0.96)
      .setStrokeStyle(2, TRACK_EDGE_COLOR, 0.75);
    const title = this.add
      .text(width / 2, height / 2 - 98, "LEVEL COMPLETE", {
        fontFamily: HUD_FONT,
        fontSize: "34px",
        fontStyle: "bold",
        color: "#4ade80",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    const result = this.add
      .text(
        width / 2,
        height / 2,
        `${this.difficulty.toUpperCase()} MODE\nAttempts: ${this.frame.attempt}\nTime: ${formatCompletionTime(this.frame.attemptElapsedMs)}\nCoins: ${this.frame.coinsCollected}/${this.level.totalCoins}`,
        {
          fontFamily: HUD_FONT,
          fontSize: "18px",
          color: HUD_TEXT_COLOR,
          align: "center",
          lineSpacing: 8,
          resolution: TEXT_RESOLUTION,
        },
      )
      .setOrigin(0.5);
    const prompt = this.add
      .text(width / 2, height / 2 + 112, "Click, tap, or press any key to play again", {
        fontFamily: HUD_FONT,
        fontSize: "14px",
        color: "#bae6fd",
        resolution: TEXT_RESOLUTION,
      })
      .setOrigin(0.5);
    this.add.container(0, 0, [backdrop, panel, title, result, prompt]).setDepth(DEPTH_HUD + 20);

    const restart = (): void => {
      this.scene.restart();
    };
    const restartFromKey = (event: KeyboardEvent): void => {
      if (event.repeat) return;
      this.input.keyboard?.off("keydown", restartFromKey);
      restart();
    };
    setTimeout(() => {
      this.input.once("pointerdown", restart);
      this.input.keyboard?.on("keydown", restartFromKey);
    }, 0);
  }
}
