import Phaser from "phaser";
import { carPowerGranted, shouldDestroyBlocker, shouldTakeDamage, type Material, type ObstacleKind } from "./ObstacleRules";
import type { PowerColor, VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";
import type { ObstacleEvent, ObstacleVariant } from "./Level";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";
import {
  CANOPY_RADIUS,
  CAR_HEIGHT,
  CAR_WIDTH,
  DEPTH_LAWN,
  DEPTH_ROAD,
  LAWN_PERSPECTIVE_SCALE,
  MOTORCYCLE_HEIGHT,
  MOTORCYCLE_WIDTH,
  OVERHEAD_GAP,
  POLE_HEIGHT,
  POLE_LAMP_RADIUS,
  POLE_WIDTH,
  TRASH_CAN_HEIGHT,
  TRASH_CAN_WIDTH,
  TRUNK_COLOR,
  TRUNK_WIDTH,
} from "./VisualScale";

const POLE_LAMP_COLOR = 0xfff2a8;
const WOOD_COLOR = 0xa97449;
const ELECTRIC_COLOR = 0x00c2d1; // shared by Electric Blocker Obstacles and the Light Pole (always Electric — see CONTEXT.md)

/**
 * Road vehicles approach faster than the neighborhood scroll so they read as
 * oncoming traffic instead of props glued to the asphalt. Spawn lead is
 * shortened by the same factor so contact still lands on the authored distance.
 */
const VEHICLE_SCROLL_MULTIPLIER = 1.55;
const WHEEL_RADIUS = 5;
const WHEEL_COLOR = 0x111827;

type SpawnedObstacle =
  | {
      gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
      lane: Lane;
      resolved: boolean;
      shape: "single";
      kind: ObstacleKind;
      variant: ObstacleVariant;
      scrollMultiplier: number;
      wheelHubs?: Phaser.GameObjects.Rectangle[];
    }
  | {
      gameObject: Phaser.GameObjects.Container;
      lane: Lane;
      resolved: boolean;
      shape: "pole";
      scrollMultiplier: number;
    };

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
  protected scrollMultiplierForEvent(event: ObstacleEvent): number {
    return isRoadVehicle(event) ? VEHICLE_SCROLL_MULTIPLIER : 1;
  }

  protected scrollMultiplierForItem(item: SpawnedObstacle): number {
    return item.scrollMultiplier;
  }

  update(delta: number): void {
    super.update(delta);
    this.spinVehicleWheels(delta);
  }

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
    const { gameObject, wheelHubs } = this.createGameObject(kind, x, groundY, variant);
    this.applyLanePresentation(gameObject, lane);
    const scrollMultiplier = variant.type === "car" || variant.type === "motorcycle" ? VEHICLE_SCROLL_MULTIPLIER : 1;
    this.items.push({
      gameObject,
      lane,
      resolved: false,
      shape: "single",
      kind,
      variant,
      scrollMultiplier,
      wheelHubs,
    });
  }

  private spawnPole(lane: Lane): void {
    const groundY = this.options.laneGroundY(lane);
    const x = this.spawnX();
    const gameObject = this.createPoleGameObject(x, groundY);
    this.applyLanePresentation(gameObject, lane);
    this.items.push({ gameObject, lane, resolved: false, shape: "pole", scrollMultiplier: 1 });
  }

  private applyLanePresentation(
    gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container,
    lane: Lane,
  ): void {
    gameObject.setDepth(lane === "lawn" ? DEPTH_LAWN : DEPTH_ROAD);
    if (lane === "lawn") {
      gameObject.setScale(LAWN_PERSPECTIVE_SCALE);
    }
  }

  private createGameObject(
    kind: ObstacleKind,
    x: number,
    groundY: number,
    variant: ObstacleVariant,
  ): {
    gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
    wheelHubs?: Phaser.GameObjects.Rectangle[];
  } {
    const color = this.colorFor(kind, variant);

    if (variant.type === "car") {
      return this.createVehicleGameObject(x, groundY, CAR_WIDTH, CAR_HEIGHT, color);
    }

    if (variant.type === "motorcycle") {
      return this.createVehicleGameObject(x, groundY, MOTORCYCLE_WIDTH, MOTORCYCLE_HEIGHT, color);
    }

    if (kind === "ground") {
      // Lawn trash can (see CONTEXT.md) — Road never uses plain ground.
      return {
        gameObject: this.scene.add.rectangle(x, groundY, TRASH_CAN_WIDTH, TRASH_CAN_HEIGHT, color).setOrigin(0.5, 1),
      };
    }

    return { gameObject: this.createTreeGameObject(x, groundY, color) };
  }

  /** Body + spinning wheel hubs so Road traffic reads as driving, not a static block. */
  private createVehicleGameObject(
    x: number,
    groundY: number,
    width: number,
    height: number,
    color: number,
  ): { gameObject: Phaser.GameObjects.Container; wheelHubs: Phaser.GameObjects.Rectangle[] } {
    const body = this.scene.add.rectangle(0, 0, width, height, color).setOrigin(0.5, 1);
    const wheelY = -WHEEL_RADIUS;
    const wheelInset = width * 0.28;
    const frontWheel = this.scene.add.circle(-wheelInset, wheelY, WHEEL_RADIUS, WHEEL_COLOR);
    const rearWheel = this.scene.add.circle(wheelInset, wheelY, WHEEL_RADIUS, WHEEL_COLOR);
    const frontHub = this.scene.add.rectangle(-wheelInset, wheelY, 2, WHEEL_RADIUS * 1.6, 0x9ca3af);
    const rearHub = this.scene.add.rectangle(wheelInset, wheelY, 2, WHEEL_RADIUS * 1.6, 0x9ca3af);
    const gameObject = this.scene.add.container(x, groundY, [body, frontWheel, rearWheel, frontHub, rearHub]);
    return { gameObject, wheelHubs: [frontHub, rearHub] };
  }

  /** Rotate wheel hubs with approach speed so vehicles look like they're rolling. */
  private spinVehicleWheels(delta: number): void {
    const baseDx = (this.options.scrollSpeed * delta) / 1000;
    for (const item of this.items) {
      if (item.shape !== "single" || !item.wheelHubs) continue;
      const roll = baseDx * item.scrollMultiplier;
      const degrees = (roll / WHEEL_RADIUS) * Phaser.Math.RAD_TO_DEG;
      for (const hub of item.wheelHubs) {
        hub.angle += degrees;
      }
    }
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
      case "motorcycle":
        return 0x1f2937;
      case "blocker":
        return variant.material === "wood" ? WOOD_COLOR : ELECTRIC_COLOR;
      case "plain":
        return kind === "ground" ? 0x4a4a4a : 0x3f7d3f; // trash can vs leafy green canopy
    }
  }
}

function isRoadVehicle(event: ObstacleEvent): boolean {
  return event.shape === "single" && (event.variant.type === "car" || event.variant.type === "motorcycle");
}
