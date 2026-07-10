import Phaser from "phaser";
import {
  carPowerGranted,
  shouldDestroyBlocker,
  shouldTakeDamage,
  type CarColor,
  type Material,
  type ObstacleKind,
} from "./ObstacleRules";
import type { PowerColor, VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";

const OBSTACLE_MIN_INTERVAL_MS = 1200;
const OBSTACLE_MAX_INTERVAL_MS = 2000;
const GROUND_OBSTACLE_WIDTH = 22;
const GROUND_OBSTACLE_HEIGHT = 36;
const OVERHEAD_OBSTACLE_WIDTH = 20;
const OVERHEAD_GAP = 50; // must satisfy duckHeight < OVERHEAD_GAP < standHeight
const LANES: Lane[] = ["road", "lawn"];
const KINDS: ObstacleKind[] = ["ground", "overhead"];
const MATERIALS: Material[] = ["wood", "electric"];
const CAR_COLORS: CarColor[] = ["red", "blue", "grey"];
const CAR_WIDTH = 34;
const CAR_HEIGHT = 24;

/**
 * Fraction of spawn events that force a lane switch: a Ground + Overhead
 * Obstacle paired in the same Lane at the same x. For every VerticalState
 * (grounded/jumping/ducking), at least one half of the pair always hits —
 * jumping clears the ground half but not the overhead half, ducking clears
 * the overhead half but not the ground half, grounded clears neither — so a
 * forced pair is only survivable by being in the other Lane. This is what
 * makes lane-switching load-bearing rather than a purely cosmetic choice
 * (see issue #3's "switching lanes is the only way to avoid some obstacle
 * placements"). Named distinctly from CONTEXT.md's "Blocker Obstacle" (a
 * Wood/Electric obstacle destroyed by a Power) — unrelated concept, same
 * area of the codebase, easy to confuse if named similarly.
 */
const FORCED_PAIR_PROBABILITY = 0.3;

/** Fraction of spawn events that are a Power-up Car instead of a regular obstacle. Cars only ever spawn in the Road Lane per issue #5. */
const CAR_PROBABILITY = 0.2;

/** Fraction of regular (non-car, non-paired) obstacles that are also a Blocker Obstacle. */
const BLOCKER_PROBABILITY = 0.25;

/**
 * A spawn is exactly one of these — never a car AND a Blocker at once. A
 * discriminated union instead of two optional fields makes that illegal
 * combination unrepresentable, rather than merely undocumented.
 */
type ObstacleVariant = { type: "plain" } | { type: "car"; carColor: CarColor } | { type: "blocker"; material: Material };

interface SpawnedObstacle {
  gameObject: Phaser.GameObjects.Rectangle;
  lane: Lane;
  kind: ObstacleKind;
  resolved: boolean;
  variant: ObstacleVariant;
  /** Set for both halves of a forced pair — resolving one resolves both as a single decision. */
  pairedWith?: SpawnedObstacle;
}

export interface PlayerPose {
  lane: Lane;
  verticalState: VerticalState;
}

export interface ObstacleFieldOptions extends ScrollingFieldOptions {
  getPlayerPose: () => PlayerPose;
  getActivePower: () => PowerColor | null;
  onMissed: () => void;
  onPowerCollected: (color: PowerColor) => void;
  onBlockerDestroyed: () => void;
}

/**
 * Owns obstacle spawning, geometry, and dodge/power/blocker-resolution. The
 * scroll/cleanup lifecycle lives in ScrollingField.
 *
 * Spawns are randomly timed/kinded/laned. That's placeholder test-track
 * scaffolding for exercising the dodge, lane-switch, and power mechanics in
 * isolation, not the intended final content — ADR-0003 commits the real
 * Level to deliberate, hand-authored placement. Ticket #6 replaces this
 * with that authored Level (see the ticket's own "replaces the test track
 * used in prior tickets" scope note).
 */
export class ObstacleField extends ScrollingField<SpawnedObstacle, ObstacleFieldOptions> {
  protected nextSpawnDelayMs(): number {
    return Phaser.Math.Between(OBSTACLE_MIN_INTERVAL_MS, OBSTACLE_MAX_INTERVAL_MS);
  }

  protected spawn(): void {
    if (Math.random() < CAR_PROBABILITY) {
      const carColor = Phaser.Utils.Array.GetRandom(CAR_COLORS);
      this.spawnObstacle("road", "ground", { type: "car", carColor });
      return;
    }

    const lane = Phaser.Utils.Array.GetRandom(LANES);

    if (Math.random() < FORCED_PAIR_PROBABILITY) {
      const ground = this.spawnObstacle(lane, "ground");
      const overhead = this.spawnObstacle(lane, "overhead");
      ground.pairedWith = overhead;
      overhead.pairedWith = ground;
      return;
    }

    const kind = Phaser.Utils.Array.GetRandom(KINDS);
    const variant: ObstacleVariant =
      Math.random() < BLOCKER_PROBABILITY
        ? { type: "blocker", material: Phaser.Utils.Array.GetRandom(MATERIALS) }
        : { type: "plain" };
    this.spawnObstacle(lane, kind, variant);
  }

  protected resolve(obstacle: SpawnedObstacle): boolean {
    const pose = this.options.getPlayerPose();
    const sameLane = obstacle.lane === pose.lane;

    if (obstacle.pairedWith) {
      // A forced pair is one decision point: being in this Lane at all
      // is the miss, regardless of pose — see FORCED_PAIR_PROBABILITY.
      obstacle.pairedWith.resolved = true;
      if (sameLane) this.options.onMissed();
      return false;
    }

    if (obstacle.variant.type === "blocker") {
      const destroyed = shouldDestroyBlocker({
        obstacleLane: obstacle.lane,
        playerLane: pose.lane,
        material: obstacle.variant.material,
        activePower: this.options.getActivePower(),
      });
      if (destroyed) {
        this.options.onBlockerDestroyed();
        return true; // destroyed on contact: gone immediately, not a normal scroll-off
      }
    }

    const hit = shouldTakeDamage({
      obstacleLane: obstacle.lane,
      obstacleKind: obstacle.kind,
      playerLane: pose.lane,
      playerState: pose.verticalState,
    });

    if (hit) {
      this.options.onMissed();
    } else if (sameLane && obstacle.variant.type === "car") {
      // sameLane matters here: shouldTakeDamage also returns false for a
      // car the player never touched because it's in the OTHER Lane — only
      // a genuinely cleared, same-Lane car grants its Power.
      const grantedPower = carPowerGranted(obstacle.variant.carColor);
      if (grantedPower) this.options.onPowerCollected(grantedPower);
    }

    return false; // never removed early — scrolls off naturally like any obstacle
  }

  private spawnObstacle(lane: Lane, kind: ObstacleKind, variant: ObstacleVariant = { type: "plain" }): SpawnedObstacle {
    const groundY = this.options.laneGroundY(lane);
    const x = this.spawnX();
    const gameObject = this.createGameObject(kind, x, groundY, variant);

    const obstacle: SpawnedObstacle = { gameObject, lane, kind, resolved: false, variant };
    this.items.push(obstacle);
    return obstacle;
  }

  private createGameObject(
    kind: ObstacleKind,
    x: number,
    groundY: number,
    variant: ObstacleVariant,
  ): Phaser.GameObjects.Rectangle {
    const color = this.colorFor(kind, variant);

    if (variant.type === "car") {
      return this.scene.add.rectangle(x, groundY, CAR_WIDTH, CAR_HEIGHT, color).setOrigin(0.5, 1);
    }

    return kind === "ground"
      ? this.scene.add.rectangle(x, groundY, GROUND_OBSTACLE_WIDTH, GROUND_OBSTACLE_HEIGHT, color).setOrigin(0.5, 1)
      : this.scene.add
          .rectangle(x, groundY - OVERHEAD_GAP, OVERHEAD_OBSTACLE_WIDTH, groundY - OVERHEAD_GAP, color)
          .setOrigin(0.5, 1);
  }

  private colorFor(kind: ObstacleKind, variant: ObstacleVariant): number {
    switch (variant.type) {
      case "car":
        if (variant.carColor === "red") return 0xd62828;
        if (variant.carColor === "blue") return 0x1d4ed8;
        return 0x9ca3af; // grey
      case "blocker":
        return variant.material === "wood" ? 0xa97449 : 0x00c2d1;
      case "plain":
        return kind === "ground" ? 0x4a4a4a : 0x8b5a2b;
    }
  }
}
