import Phaser from "phaser";
import { carPowerGranted, shouldDestroyBlocker, shouldTakeDamage, type ObstacleKind } from "./ObstacleRules";
import type { PowerColor, VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";
import type { ObstacleEvent, ObstacleVariant } from "./Level";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";

const GROUND_OBSTACLE_WIDTH = 22;
const GROUND_OBSTACLE_HEIGHT = 36;
const OVERHEAD_OBSTACLE_WIDTH = 20;
const OVERHEAD_GAP = 50; // must satisfy duckHeight < OVERHEAD_GAP < standHeight
const CAR_WIDTH = 34;
const CAR_HEIGHT = 24;

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
 * Owns obstacle geometry and dodge/power/blocker-resolution for the
 * authored Level's Obstacle/Car events (see Level.ts, ADR-0003). The
 * spawn-timing/scroll/cleanup lifecycle lives in ScrollingField.
 */
export class ObstacleField extends ScrollingField<ObstacleEvent, SpawnedObstacle, ObstacleFieldOptions> {
  protected spawnEvent(event: ObstacleEvent): void {
    if (event.shape === "pair") {
      // A forced pair is one authored decision point that produces two game
      // objects — see the pairedWith handling in resolve() below.
      const ground = this.spawnObstacle(event.lane, "ground", { type: "plain" });
      const overhead = this.spawnObstacle(event.lane, "overhead", { type: "plain" });
      ground.pairedWith = overhead;
      overhead.pairedWith = ground;
      return;
    }

    this.spawnObstacle(event.lane, event.kind, event.variant);
  }

  protected resolve(obstacle: SpawnedObstacle): boolean {
    const pose = this.options.getPlayerPose();
    const sameLane = obstacle.lane === pose.lane;

    if (obstacle.pairedWith) {
      // A forced pair is one decision point: being in this Lane at all
      // is the miss, regardless of pose.
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

  private spawnObstacle(lane: Lane, kind: ObstacleKind, variant: ObstacleVariant): SpawnedObstacle {
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
