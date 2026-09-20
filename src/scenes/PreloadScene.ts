import Phaser from "phaser";
import { SPRITE_FRAME_HEIGHT, SPRITE_FRAME_WIDTH, SPRITE_SHEET_KEY } from "../game/PlayerSpriteAnim";

/**
 * Loads the Supa Dude sprite sheet before GameScene starts. The art hasn't
 * shipped yet (see docs/art/supa-dude-sprite-spec.md) — a missing file just
 * fails this one load quietly, leaving `supa-dude` absent from the texture
 * cache, and GameScene falls back to its primitive-drawn character when it
 * checks `this.textures.exists(SPRITE_SHEET_KEY)`. No error handling needed
 * beyond that: Phaser's loader continues past a failed file on its own.
 */
export class PreloadScene extends Phaser.Scene {
  constructor() {
    super("PreloadScene");
  }

  preload(): void {
    this.load.spritesheet(SPRITE_SHEET_KEY, "sprites/supa-dude.png", {
      frameWidth: SPRITE_FRAME_WIDTH,
      frameHeight: SPRITE_FRAME_HEIGHT,
    });
  }

  create(): void {
    this.scene.start("GameScene");
  }
}
