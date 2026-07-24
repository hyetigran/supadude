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

export interface DistanceEvent {
  distance: number;
}

/**
 * Shared spawn/scroll/resolve/cleanup lifecycle for lane-scrolling entities,
 * driven by an authored, distance-indexed event queue (the Level — see
 * Level.ts) rather than a random spawn timer. ADR-0003 committed the real
 * Level to deliberate, hand-authored placement, replacing the random-timer
 * placeholder test-track scaffolding this class previously drove (issue #6).
 *
 * An event is spawned so that, given its scroll multiplier, it reaches
 * characterX right as traveled distance reaches its authored distance
 * (faster movers spawn later / closer; see spawnLeadFor).
 */
export abstract class ScrollingField<
  TEvent extends DistanceEvent,
  TItem extends ScrollableItem,
  TOptions extends ScrollingFieldOptions,
> {
  protected items: TItem[] = [];
  private pending: TEvent[];
  private traveled = 0;
  private stopped = true;

  constructor(
    protected readonly scene: Phaser.Scene,
    protected readonly options: TOptions,
    private readonly allEvents: TEvent[],
  ) {
    this.pending = [...allEvents];
  }

  start(): void {
    this.stopped = false;
  }

  stop(): void {
    this.stopped = true;
  }

  /**
   * Rewinds to a Checkpoint respawn: destroys everything currently on
   * screen and rebuilds the pending queue from the authored events at or
   * after that distance, so the stretch since the Checkpoint replays.
   * Subclasses exclude already-resolved events with a persistent one-time
   * effect (e.g. a Coin already collected) via shouldReplay.
   */
  seek(distance: number): void {
    for (const item of this.items) item.gameObject.destroy();
    this.items = [];
    this.traveled = distance;
    this.pending = this.allEvents.filter((event) => event.distance >= distance && this.shouldReplay(event));
  }

  update(delta: number): void {
    if (this.stopped) return;

    const baseDx = (this.options.scrollSpeed * delta) / 1000;
    this.traveled += baseDx;

    while (this.pending.length > 0 && this.pending[0].distance <= this.traveled + this.spawnLeadFor(this.pending[0])) {
      this.spawnEvent(this.pending.shift()!);
    }

    const { characterX } = this.options;
    for (let i = this.items.length - 1; i >= 0; i--) {
      const item = this.items[i];
      item.gameObject.x -= baseDx * this.scrollMultiplierForItem(item);

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

  /** Screen distance from spawnX to characterX — the path an item scrolls across. */
  protected screenTravelDistance(): number {
    return this.scene.scale.width + SPAWN_MARGIN - this.options.characterX;
  }

  /**
   * How early (in traveled world px) to spawn so contact still lands on
   * event.distance when the item moves at scrollSpeed * multiplier.
   */
  protected spawnLeadFor(event: TEvent): number {
    return this.screenTravelDistance() / this.scrollMultiplierForEvent(event);
  }

  /** 1 = locked to the background; >1 approaches faster (oncoming). */
  protected scrollMultiplierForEvent(_event: TEvent): number {
    return 1;
  }

  protected scrollMultiplierForItem(_item: TItem): number {
    return 1;
  }

  /**
   * Whether an authored event should still fire when replayed after a
   * seek(). Defaults to yes; override to dedupe an event with a persistent
   * one-time effect (e.g. Coins — see CollectibleField).
   */
  protected shouldReplay(_event: TEvent): boolean {
    return true;
  }

  protected abstract spawnEvent(event: TEvent): void;

  /**
   * Called once when an item first reaches the player's x. Return true to
   * remove it immediately (e.g. a collected pickup should vanish on
   * contact); false to let it scroll off and be culled normally (e.g. a
   * missed or passed obstacle keeps moving).
   */
  protected abstract resolve(item: TItem): boolean;
}
