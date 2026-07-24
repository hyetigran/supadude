import Phaser from "phaser";
import { DEPTH_HUD } from "../game/VisualScale";

const PARTICLE_TEXTURE = "fx-particle-dot";
const PARTICLE_RADIUS = 4;
const BURST_DEPTH = DEPTH_HUD - 1;

export interface BurstOptions {
  count?: number;
  speedMin?: number;
  speedMax?: number;
  lifespanMs?: number;
  gravityY?: number;
  scaleStart?: number;
}

/**
 * Scene-local juice: particle bursts + camera shake/flash, all built from
 * one generated dot texture rather than art assets (placeholder-art phase,
 * see VisualScale). Owned per-GameScene instance; nothing here is pure
 * enough to unit test meaningfully, matching PauseOverlay's precedent of
 * going untested.
 */
export class Fx {
  constructor(private readonly scene: Phaser.Scene) {
    if (!scene.textures.exists(PARTICLE_TEXTURE)) {
      const graphics = scene.add.graphics();
      graphics.fillStyle(0xffffff, 1);
      graphics.fillCircle(PARTICLE_RADIUS, PARTICLE_RADIUS, PARTICLE_RADIUS);
      graphics.generateTexture(PARTICLE_TEXTURE, PARTICLE_RADIUS * 2, PARTICLE_RADIUS * 2);
      graphics.destroy();
    }
  }

  /** One-shot particle burst at (x, y); the emitter cleans itself up after its particles expire. */
  burst(x: number, y: number, color: number, options: BurstOptions = {}): void {
    const lifespan = options.lifespanMs ?? 380;
    const emitter = this.scene.add.particles(x, y, PARTICLE_TEXTURE, {
      lifespan,
      speed: { min: options.speedMin ?? 60, max: options.speedMax ?? 160 },
      scale: { start: options.scaleStart ?? 1, end: 0 },
      gravityY: options.gravityY ?? 0,
      tint: color,
      quantity: options.count ?? 10,
      emitting: false,
    });
    emitter.setDepth(BURST_DEPTH);
    emitter.explode(options.count ?? 10);
    this.scene.time.delayedCall(lifespan + 60, () => emitter.destroy());
  }

  shake(durationMs = 140, intensity = 0.008): void {
    this.scene.cameras.main.shake(durationMs, intensity);
  }

  flash(color: number, durationMs = 120): void {
    const rgb = Phaser.Display.Color.IntegerToColor(color);
    this.scene.cameras.main.flash(durationMs, rgb.red, rgb.green, rgb.blue);
  }
}
