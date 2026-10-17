import Phaser from "phaser";
import type { CoinEvent } from "./Level";
import { COIN_RADIUS, DEPTH_TRACK } from "./VisualScale";

const VIEW_MARGIN = 80;

interface RenderedCoin {
  event: CoinEvent;
  gameObject: Phaser.GameObjects.Container;
}

/** Render-only Coin projection. Collection state is driven by Runner events. */
export class CollectibleField {
  private readonly coins = new Map<string, RenderedCoin>();
  private readonly collected = new Set<string>();

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly groundY: number,
    private readonly characterX: number,
    events: readonly CoinEvent[],
    private readonly reducedMotion = false,
  ) {
    for (const event of events) {
      this.coins.set(event.id, { event, gameObject: this.createCoin(event) });
    }
    this.render(0);
  }

  render(distance: number, visible = true): void {
    for (const { event, gameObject } of this.coins.values()) {
      const x = this.characterX + event.x - distance;
      const onScreen = x > -VIEW_MARGIN && x < this.scene.scale.width + VIEW_MARGIN;
      gameObject.x = x;
      gameObject.angle = this.reducedMotion ? 0 : distance * 0.8 % 360;
      gameObject.setVisible(visible && onScreen && !this.collected.has(event.id));
    }
  }

  collect(id: string): void {
    this.collected.add(id);
    this.coins.get(id)?.gameObject.setVisible(false);
  }

  reset(): void {
    this.collected.clear();
  }

  private createCoin(event: CoinEvent): Phaser.GameObjects.Container {
    const rim = this.scene.add.circle(0, 0, COIN_RADIUS, 0xffd166).setStrokeStyle(2, 0xfff4b8, 1);
    const center = this.scene.add.circle(0, 0, COIN_RADIUS * 0.48, 0xf59e0b).setStrokeStyle(1, 0x8a5a00, 0.8);
    const shine = this.scene.add.rectangle(-3, -2, 3, 9, 0xfff9db, 0.9).setAngle(25);
    return this.scene.add
      .container(0, this.groundY - event.altitude, [rim, center, shine])
      .setDepth(DEPTH_TRACK + 0.5);
  }
}
