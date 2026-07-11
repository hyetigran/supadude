import Phaser from "phaser";
import { carPowerGranted, shouldDestroyBlocker, shouldTakeDamage, type ObstacleKind } from "./ObstacleRules";
import type { PowerColor, VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";
import type { ObstacleEvent, ObstacleVariant } from "./Level";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";

const GROUND_OBSTACLE_WIDTH = 22;
const GROUND_OBSTACLE_HEIGHT = 36;
const OVERHEAD_GAP = 50; // must satisfy duckHeight < OVERHEAD_GAP < standHeight
const CAR_WIDTH = 34;
const CAR_HEIGHT = 24;
const TRUNK_WIDTH = 8;
const TRUNK_COLOR = 0x6b4226;
const CANOPY_RADIUS = 20;

interface SpawnedObstacle {
  gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
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
  ): Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container {
    const color = this.colorFor(kind, variant);

    if (variant.type === "car") {
      return this.scene.add.rectangle(x, groundY, CAR_WIDTH, CAR_HEIGHT, color).setOrigin(0.5, 1);
    }

    if (kind === "ground") {
      return this.scene.add.rectangle(x, groundY, GROUND_OBSTACLE_WIDTH, GROUND_OBSTACLE_HEIGHT, color).setOrigin(0.5, 1);
    }

    return this.createTreeGameObject(x, groundY, color);
  }

  /**
   * An Overhead Obstacle reads as a tree planted in the ground — a trunk
   * rooted at Lane level, topped with a wider leafy canopy that sits
   * entirely above the duck-clearance line (never dipping into it), rather
   * than a bar hanging disconnected from the top of the screen. Purely
   * visual: the dodge rule itself is pose-based (see ObstacleRules.isCleared),
   * not pixel geometry, but the canopy's placement is chosen so "duck the
   * leafy part" reads as literally true, not just roughly tree-shaped.
   */
  private createTreeGameObject(x: number, groundY: number, canopyColor: number): Phaser.GameObjects.Container {
    const trunk = this.scene.add.rectangle(0, 0, TRUNK_WIDTH, OVERHEAD_GAP, TRUNK_COLOR).setOrigin(0.5, 1);
    const canopy = this.scene.add.circle(0, -OVERHEAD_GAP - CANOPY_RADIUS, CANOPY_RADIUS, canopyColor);
    return this.scene.add.container(x, groundY, [trunk, canopy]);
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
        return kind === "ground" ? 0x4a4a4a : 0x3f7d3f; // leafy green canopy for a plain tree
    }
  }
}
