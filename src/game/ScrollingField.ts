import Phaser from "phaser";
import type { Lane } from "./Lane";

const SPAWN_MARGIN = 40;
const DESPAWN_MARGIN = 60;
const RESOLVE_TOLERANCE = 14;

export interface ScrollingFieldOptions {
  laneGroundY: (lane: Lane) => number;
  characterX: number;
  scrollSpeed: number;
}

export interface ScrollableItem {
  gameObject: { x: number; destroy: () => void };
  resolved: boolean;
}

/**
 * Shared spawn/scroll/resolve/cleanup lifecycle for lane-scrolling entities.
 * ObstacleField and CollectibleField both had this exact loop shape
 * independently; Power-up Cars (next ticket) need it a third time, which is
 * where duplicating it again stops being the cheaper option. Each subclass
 * owns its own spawn timing/geometry and what "resolving" an item means —
 * this only owns the part all three share: scroll left, resolve once when
 * in range, cull once off-screen.
 */
export abstract class ScrollingField<TItem extends ScrollableItem, TOptions extends ScrollingFieldOptions> {
  protected items: TItem[] = [];
  private stopped = false;

  constructor(
    protected readonly scene: Phaser.Scene,
    protected readonly options: TOptions,
  ) {}

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    this.stopped = true;
  }

  update(delta: number): void {
    if (this.stopped) return;

    const dx = (this.options.scrollSpeed * delta) / 1000;
    const { characterX } = this.options;

    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.gameObject.x -= dx;

      if (!item.resolved && item.gameObject.x <= characterX + RESOLVE_TOLERANCE) {
        item.resolved = true;
        if (this.resolve(item)) {
          item.gameObject.destroy();
          this.items.splice(i, 1);
          continue;
        }
      }

      if (item.gameObject.x < -DESPAWN_MARGIN) {
        item.gameObject.destroy();
        this.items.splice(i, 1);
      }
    }
  }

  protected spawnX(): number {
    return this.scene.scale.width + SPAWN_MARGIN;
  }

  private scheduleNext(): void {
    if (this.stopped) return;
    this.scene.time.delayedCall(this.nextSpawnDelayMs(), () => {
      if (this.stopped) return;
      this.spawn();
      this.scheduleNext();
    });
  }

  protected abstract nextSpawnDelayMs(): number;
  protected abstract spawn(): void;

  /**
   * Called once when an item first reaches the player's x. Return true to
   * remove it immediately (e.g. a collected pickup should vanish on
   * contact); false to let it scroll off and be culled normally (e.g. a
   * missed or passed obstacle keeps moving).
   */
  protected abstract resolve(item: TItem): boolean;
}
