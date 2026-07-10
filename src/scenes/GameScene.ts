import Phaser from "phaser";
import { GameState } from "../game/GameState";
import { InputManager } from "../game/InputManager";
import { KeyboardAdapter } from "../game/KeyboardAdapter";

const CHARACTER_X = 200;
const GROUND_Y_RATIO = 0.75;
const SCROLL_SPEED = 220; // px/sec
const BACKGROUND_TEXTURE = "placeholder-background";
const BACKGROUND_TILE_WIDTH = 160;

/**
 * Placeholder tracer-bullet scene: proves the auto-run illusion, the
 * Scene/GameState/InputManager wiring, and the deploy pipeline all work
 * end-to-end. Real art, obstacles, and dodge mechanics land in later tickets.
 */
export class GameScene extends Phaser.Scene {
  /** Public: the acceptance criterion for this ticket is that it exists, ready for later tickets to drive. */
  readonly gameState = new GameState();
  private readonly playerInput = new InputManager();
  private keyboardAdapter?: KeyboardAdapter;
  private background?: Phaser.GameObjects.TileSprite;

  constructor() {
    super("GameScene");
  }

  create(): void {
    this.createBackgroundTexture();
    this.background = this.add
      .tileSprite(0, 0, this.scale.width, this.scale.height, BACKGROUND_TEXTURE)
      .setOrigin(0, 0);

    this.createCharacterPlaceholder();

    if (this.input.keyboard) {
      this.keyboardAdapter = new KeyboardAdapter(this.input.keyboard, this.playerInput);
    }

    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => this.keyboardAdapter?.destroy());
  }

  update(_time: number, delta: number): void {
    if (this.background) {
      this.background.tilePositionX += (SCROLL_SPEED * delta) / 1000;
    }
  }

  /**
   * Generates a small repeating tile (sky, ground, and a fence-post
   * landmark) rather than a full-screen image, so tiling it across a
   * TileSprite produces a visible, scrollable pattern — a flat single-color
   * background would make the auto-run scroll invisible.
   */
  private getGroundY(): number {
    return this.scale.height * GROUND_Y_RATIO;
  }

  private createBackgroundTexture(): void {
    const width = BACKGROUND_TILE_WIDTH;
    const height = this.scale.height;
    const groundY = this.getGroundY();

    const graphics = this.add.graphics();
    graphics.fillStyle(0x87ceeb, 1);
    graphics.fillRect(0, 0, width, groundY);
    graphics.fillStyle(0x6b8e4e, 1);
    graphics.fillRect(0, groundY, width, height - groundY);
    graphics.lineStyle(2, 0x4a4a4a, 1);
    graphics.lineBetween(0, groundY, width, groundY);

    graphics.fillStyle(0x8b5a2b, 1);
    graphics.fillRect(width - 6, groundY - 30, 6, 30);

    graphics.generateTexture(BACKGROUND_TEXTURE, width, height);
    graphics.destroy();
  }

  private createCharacterPlaceholder(): void {
    const groundY = this.getGroundY();

    const head = this.add.circle(0, -40, 12, 0x000000);
    const body = this.add.rectangle(0, -10, 6, 40, 0x000000);
    const cape = this.add.triangle(-4, -20, 0, -20, -10, 20, 4, 20, 0xd62828);

    const character = this.add.container(CHARACTER_X, groundY, [cape, body, head]);

    // A quick, slightly-tilting bounce reads as a running stride; final
    // sprite-sheet animation replaces this in the art-integration ticket.
    this.tweens.add({
      targets: character,
      y: groundY - 14,
      angle: { from: -4, to: 4 },
      duration: 130,
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut",
    });
  }
}
