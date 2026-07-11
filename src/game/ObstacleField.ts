import Phaser from "phaser";
import { carPowerGranted, shouldDestroyBlocker, shouldTakeDamage, type Material, type ObstacleKind } from "./ObstacleRules";
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
const POLE_WIDTH = 8;
const POLE_HEIGHT = 150; // well past both the Jump and Duck clearance zones — ungapped by pose alone
const POLE_LAMP_RADIUS = 9;
const POLE_LAMP_COLOR = 0xfff2a8;
const WOOD_COLOR = 0xa97449;
const ELECTRIC_COLOR = 0x00c2d1; // shared by Electric Blocker Obstacles and the Light Pole (always Electric — see CONTEXT.md)

type SpawnedObstacle =
  | {
      gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
      lane: Lane;
      resolved: boolean;
      shape: "single";
      kind: ObstacleKind;
      variant: ObstacleVariant;
    }
  | { gameObject: Phaser.GameObjects.Container; lane: Lane; resolved: boolean; shape: "pole" };

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
 * authored Level's Obstacle/Car/Light Pole events (see Level.ts, ADR-0003).
 * The spawn-timing/scroll/cleanup lifecycle lives in ScrollingField.
 */
export class ObstacleField extends ScrollingField<ObstacleEvent, SpawnedObstacle, ObstacleFieldOptions> {
  protected spawnEvent(event: ObstacleEvent): void {
    if (event.shape === "pole") {
      this.spawnPole(event.lane);
      return;
    }

    this.spawnObstacle(event.lane, event.kind, event.variant);
  }

  protected resolve(obstacle: SpawnedObstacle): boolean {
    const pose = this.options.getPlayerPose();
    const sameLane = obstacle.lane === pose.lane;

    if (obstacle.shape === "pole") {
      // Spans the full clearance height — Jump/Duck never clear it, only a
      // Lane switch does. Always Electric material (see CONTEXT.md Light
      // Pole), so a same-Lane hit can still be shortcut by Water Power.
      if (!sameLane) return false;
      if (this.tryDestroyBlocker(obstacle.lane, pose.lane, "electric")) return true;

      this.options.onMissed();
      return false;
    }

    if (obstacle.variant.type === "blocker" && this.tryDestroyBlocker(obstacle.lane, pose.lane, obstacle.variant.material)) {
      return true; // destroyed on contact: gone immediately, not a normal scroll-off
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

  /** Shared by both the Light Pole and Blocker Obstacle resolve() branches — same "matching Power, same Lane" destroy check either way. */
  private tryDestroyBlocker(obstacleLane: Lane, playerLane: Lane, material: Material): boolean {
    const destroyed = shouldDestroyBlocker({
      obstacleLane,
      playerLane,
      material,
      activePower: this.options.getActivePower(),
    });
    if (destroyed) this.options.onBlockerDestroyed();
    return destroyed;
  }

  private spawnObstacle(lane: Lane, kind: ObstacleKind, variant: ObstacleVariant): void {
    const groundY = this.options.laneGroundY(lane);
    const x = this.spawnX();
    const gameObject = this.createGameObject(kind, x, groundY, variant);
    this.items.push({ gameObject, lane, resolved: false, shape: "single", kind, variant });
  }

  private spawnPole(lane: Lane): void {
    const groundY = this.options.laneGroundY(lane);
    const x = this.spawnX();
    const gameObject = this.createPoleGameObject(x, groundY);
    this.items.push({ gameObject, lane, resolved: false, shape: "pole" });
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

  /** The Light Pole (see CONTEXT.md): one grounded pole tall enough to clearly read as ungapped by Jump or Duck, topped with a lamp. */
  private createPoleGameObject(x: number, groundY: number): Phaser.GameObjects.Container {
    const pole = this.scene.add.rectangle(0, 0, POLE_WIDTH, POLE_HEIGHT, ELECTRIC_COLOR).setOrigin(0.5, 1);
    const lamp = this.scene.add.circle(0, -POLE_HEIGHT, POLE_LAMP_RADIUS, POLE_LAMP_COLOR);
    return this.scene.add.container(x, groundY, [pole, lamp]);
  }

  private colorFor(kind: ObstacleKind, variant: ObstacleVariant): number {
    switch (variant.type) {
      case "car":
        if (variant.carColor === "red") return 0xd62828;
        if (variant.carColor === "blue") return 0x1d4ed8;
        return 0x9ca3af; // grey
      case "blocker":
        return variant.material === "wood" ? WOOD_COLOR : ELECTRIC_COLOR;
      case "plain":
        return kind === "ground" ? 0x4a4a4a : 0x3f7d3f; // leafy green canopy for a plain tree
    }
  }
}
