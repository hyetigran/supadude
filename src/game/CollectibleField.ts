import Phaser from "phaser";
import type { Lane } from "./Lane";
import type { CollectibleEvent, CollectibleKind } from "./Level";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";
import {
  COLLECTIBLE_HEIGHT_ABOVE_LANE,
  COLLECTIBLE_RADIUS,
  DEPTH_LAWN,
  DEPTH_ROAD,
  LAWN_PERSPECTIVE_SCALE,
} from "./VisualScale";

interface SpawnedCollectible {
  gameObject: Phaser.GameObjects.Arc;
  lane: Lane;
  kind: CollectibleKind;
  resolved: boolean;
  distance: number;
}

export interface CollectibleFieldOptions extends ScrollingFieldOptions {
  getLane: () => Lane;
  onHeartCollected: () => void;
  onCoinCollected: () => void;
}

/**
 * Owns Heart/Coin pickup-resolution for the authored Level's Collectible
 * events (see Level.ts) — the collectible sibling to ObstacleField, sharing
 * the spawn-timing/scroll/cleanup lifecycle via ScrollingField. Collection
 * only depends on being in the matching Lane (unlike Obstacles, pose is
 * irrelevant here); missing a pickup by being in the other Lane has no
 * penalty, it just scrolls past.
 *
 * A Coin already collected this Attempt is never re-awarded if a Checkpoint
 * respawn replays the stretch it sits in (see shouldReplay) — Coins are a
 * persistent "collected/total" completion stat (CONTEXT.md), so double-
 * counting one across a respawn would overcount it. Hearts have no such
 * stat and are harmless to re-collect, so they always replay.
 */
export class CollectibleField extends ScrollingField<CollectibleEvent, SpawnedCollectible, CollectibleFieldOptions> {
  private readonly collectedCoinDistances = new Set<number>();

  protected shouldReplay(event: CollectibleEvent): boolean {
    return event.kind !== "coin" || !this.collectedCoinDistances.has(event.distance);
  }

  protected spawnEvent(event: CollectibleEvent): void {
    const groundY = this.options.laneGroundY(event.lane);
    const x = this.spawnX();
    const y = groundY - COLLECTIBLE_HEIGHT_ABOVE_LANE;
    const color = event.kind === "heart" ? 0xff4d6d : 0xffd700;

    const gameObject = this.scene.add.circle(x, y, COLLECTIBLE_RADIUS, color);
    gameObject.setDepth(event.lane === "lawn" ? DEPTH_LAWN : DEPTH_ROAD);
    if (event.lane === "lawn") {
      gameObject.setScale(LAWN_PERSPECTIVE_SCALE);
    }
    this.items.push({ gameObject, lane: event.lane, kind: event.kind, resolved: false, distance: event.distance });
  }

  protected resolve(collectible: SpawnedCollectible): boolean {
    if (collectible.lane !== this.options.getLane()) return false;

    if (collectible.kind === "heart") {
      this.options.onHeartCollected();
    } else {
      this.collectedCoinDistances.add(collectible.distance);
      this.options.onCoinCollected();
    }

    return true; // vanish on contact, unlike an obstacle that scrolls off
  }
}
