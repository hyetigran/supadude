import { VIEWPORT } from "./Viewport";
import Phaser from "phaser";
import type { CoinEvent } from "./Level";
import { COIN_RADIUS, DEPTH_TRACK } from "./VisualScale";
import { createObjectImage } from "./ObjectArt";
import { coinPlacement } from "./ObjectFit";

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
      const onScreen = x > -VIEW_MARGIN && x < VIEWPORT.width + VIEW_MARGIN;
      gameObject.x = x;
      // A flat coin face reads as spinning by narrowing, not by rotating in the screen plane.
      gameObject.scaleX = this.reducedMotion ? 1 : Math.max(0.2, Math.abs(Math.cos(distance * 0.014)));
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
    const coin = createObjectImage(this.scene, coinPlacement(COIN_RADIUS));
    return this.scene.add
      .container(0, this.groundY - event.altitude, [coin])
      .setDepth(DEPTH_TRACK + 0.5);
  }
}
