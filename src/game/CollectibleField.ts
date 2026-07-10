import Phaser from "phaser";
import type { Lane } from "./Lane";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";

const COLLECTIBLE_MIN_INTERVAL_MS = 900;
const COLLECTIBLE_MAX_INTERVAL_MS = 1600;
const COLLECTIBLE_RADIUS = 9;
const COLLECTIBLE_HEIGHT_ABOVE_LANE = 40;
const HEART_PROBABILITY = 0.35;
const LANES: Lane[] = ["road", "lawn"];

type CollectibleKind = "heart" | "coin";

interface SpawnedCollectible {
  gameObject: Phaser.GameObjects.Arc;
  lane: Lane;
  kind: CollectibleKind;
  resolved: boolean;
}

export interface CollectibleFieldOptions extends ScrollingFieldOptions {
  getLane: () => Lane;
  onHeartCollected: () => void;
  onCoinCollected: () => void;
}

/**
 * Owns Heart/Coin spawning and pickup-resolution — the collectible sibling
 * to ObstacleField, sharing the scroll/cleanup lifecycle via ScrollingField.
 * Collection only depends on being in the matching Lane (unlike Obstacles,
 * pose is irrelevant here); missing a pickup by being in the other Lane has
 * no penalty, it just scrolls past.
 *
 * Spawns are randomly timed/kinded/laned, same placeholder test-track
 * scaffolding as ObstacleField — ticket #6 replaces this with the real
 * authored Level.
 */
export class CollectibleField extends ScrollingField<SpawnedCollectible, CollectibleFieldOptions> {
  protected nextSpawnDelayMs(): number {
    return Phaser.Math.Between(COLLECTIBLE_MIN_INTERVAL_MS, COLLECTIBLE_MAX_INTERVAL_MS);
  }

  protected spawn(): void {
    const lane = Phaser.Utils.Array.GetRandom(LANES);
    const kind: CollectibleKind = Math.random() < HEART_PROBABILITY ? "heart" : "coin";
    const groundY = this.options.laneGroundY(lane);
    const x = this.spawnX();
    const y = groundY - COLLECTIBLE_HEIGHT_ABOVE_LANE;
    const color = kind === "heart" ? 0xff4d6d : 0xffd700;

    const gameObject = this.scene.add.circle(x, y, COLLECTIBLE_RADIUS, color);
    this.items.push({ gameObject, lane, kind, resolved: false });
  }

  protected resolve(collectible: SpawnedCollectible): boolean {
    if (collectible.lane !== this.options.getLane()) return false;

    if (collectible.kind === "heart") this.options.onHeartCollected();
    else this.options.onCoinCollected();

    return true; // vanish on contact, unlike an obstacle that scrolls off
  }
}
