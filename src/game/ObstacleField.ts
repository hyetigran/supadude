import Phaser from "phaser";
import type { Lane } from "./Lane";
import { OBSTACLE_CATALOG, type ObstacleDefinition } from "./ObstacleCatalog";
import { shouldDestroyBlocker, shouldTakeDamage, type Material } from "./ObstacleRules";
import type { ObstacleEvent } from "./Level";
import type { PowerColor, VerticalState } from "./PlayerState";
import { ScrollingField, type ScrollingFieldOptions } from "./ScrollingField";
import {
  CANOPY_RADIUS,
  CAR_HEIGHT,
  CAR_WIDTH,
  FIRE_HYDRANT_HEIGHT,
  FIRE_HYDRANT_WIDTH,
  MOTORCYCLE_HEIGHT,
  MOTORCYCLE_WIDTH,
  OVERHEAD_BAR_HEIGHT,
  OVERHEAD_BAR_WIDTH,
  OVERHEAD_GAP,
  TRASH_CAN_HEIGHT,
  TRASH_CAN_WIDTH,
  TRUNK_COLOR,
  UTILITY_BOX_HEIGHT,
  UTILITY_BOX_WIDTH,
} from "./VisualScale";

const TRASH_CAN_COLOR = 0x4a4a4a;
const AWNING_COLOR = 0xf59e0b;
const AWNING_STRIPE_COLOR = 0xfff7ed;
const FIRE_HYDRANT_COLOR = 0xdc2626;
const LEAF_COLOR = 0x3f7d3f;
const ELECTRIC_COLOR = 0x00c2d1;
const MOTORCYCLE_COLOR = 0x1f2937;
const GREY_CAR_COLOR = 0x9ca3af;
const FIRE_CAR_COLOR = 0xd62828;
const WATER_CAR_COLOR = 0x1d4ed8;
const STREET_BANNER_COLOR = 0x7c3aed;

/** Oncoming Street traffic approaches faster than stationary neighborhood fixtures. */
const VEHICLE_SCROLL_MULTIPLIER = 1.55;
const WHEEL_RADIUS = 5;
const WHEEL_COLOR = 0x111827;

interface SpawnedObstacle {
  gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
  lane: Lane;
  resolved: boolean;
  definition: ObstacleDefinition;
  scrollMultiplier: number;
  wheelHubs?: Phaser.GameObjects.Rectangle[];
}

interface RenderedObstacle {
  gameObject: Phaser.GameObjects.Rectangle | Phaser.GameObjects.Container;
  wheelHubs?: Phaser.GameObjects.Rectangle[];
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
 * Owns obstacle geometry and collision resolution for the authored Level.
 * Lane, dodge kind, appearance, motion, material, and Power are all read from
 * ObstacleCatalog so Level events cannot assemble invalid combinations.
 */
export class ObstacleField extends ScrollingField<ObstacleEvent, SpawnedObstacle, ObstacleFieldOptions> {
  protected scrollMultiplierForEvent(event: ObstacleEvent): number {
    return this.scrollMultiplierForDefinition(OBSTACLE_CATALOG[event.obstacle]);
  }

  protected scrollMultiplierForItem(item: SpawnedObstacle): number {
    return item.scrollMultiplier;
  }

  update(delta: number): void {
    super.update(delta);
    this.spinVehicleWheels(delta);
  }

  protected spawnEvent(event: ObstacleEvent): void {
    this.spawnObstacle(OBSTACLE_CATALOG[event.obstacle]);
  }

  protected resolve(obstacle: SpawnedObstacle): boolean {
    const pose = this.options.getPlayerPose();
    const { lane, kind, material, power } = obstacle.definition;
    const sameLane = lane === pose.lane;

    if (material && this.tryDestroyBlocker(lane, pose.lane, material)) {
      return true;
    }

    const hit = shouldTakeDamage({
      obstacleLane: lane,
      obstacleKind: kind,
      playerLane: pose.lane,
      playerState: pose.verticalState,
    });

    if (hit) {
      this.options.onMissed();
    } else if (sameLane && power) {
      // A Power-up Car only grants its Power after a successful same-Lane jump.
      this.options.onPowerCollected(power);
    }

    return false;
  }

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

  private spawnObstacle(definition: ObstacleDefinition): void {
    const presentation = this.options.lanePresentation(definition.lane);
    const x = this.spawnX();
    const { gameObject, wheelHubs } = this.createGameObject(definition, x, presentation.groundY);
    gameObject.setDepth(presentation.depth).setScale(presentation.scale);

    this.items.push({
      gameObject,
      lane: definition.lane,
      resolved: false,
      definition,
      scrollMultiplier: this.scrollMultiplierForDefinition(definition),
      wheelHubs,
    });
  }

  private scrollMultiplierForDefinition(definition: ObstacleDefinition): number {
    return definition.motion === "oncoming" ? VEHICLE_SCROLL_MULTIPLIER : 1;
  }

  private createGameObject(definition: ObstacleDefinition, x: number, groundY: number): RenderedObstacle {
    switch (definition.appearance) {
      case "trashCan":
        return {
          gameObject: this.scene.add
            .rectangle(x, groundY, TRASH_CAN_WIDTH, TRASH_CAN_HEIGHT, TRASH_CAN_COLOR)
            .setOrigin(0.5, 1),
        };
      case "awning":
        return { gameObject: this.createAwningGameObject(x, groundY) };
      case "fireHydrant":
        return { gameObject: this.createFireHydrantGameObject(x, groundY) };
      case "lowBranch":
        return { gameObject: this.createLowBranchGameObject(x, groundY) };
      case "utilityBox":
        return {
          gameObject: this.scene.add
            .rectangle(x, groundY, UTILITY_BOX_WIDTH, UTILITY_BOX_HEIGHT, ELECTRIC_COLOR)
            .setOrigin(0.5, 1),
        };
      case "motorcycle":
        return this.createVehicleGameObject(
          x,
          groundY,
          MOTORCYCLE_WIDTH,
          MOTORCYCLE_HEIGHT,
          MOTORCYCLE_COLOR,
        );
      case "car":
        return this.createVehicleGameObject(x, groundY, CAR_WIDTH, CAR_HEIGHT, this.carColor(definition.power));
      case "streetBanner":
        return { gameObject: this.createStreetBannerGameObject(x, groundY) };
      default:
        return assertNeverAppearance(definition.appearance);
    }
  }

  /** Body + spinning wheel hubs so Street traffic reads as driving, not a static block. */
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

  private createFireHydrantGameObject(x: number, groundY: number): Phaser.GameObjects.Container {
    const body = this.scene.add
      .rectangle(0, 0, FIRE_HYDRANT_WIDTH * 0.62, FIRE_HYDRANT_HEIGHT, FIRE_HYDRANT_COLOR)
      .setOrigin(0.5, 1);
    const cap = this.scene.add.rectangle(
      0,
      -FIRE_HYDRANT_HEIGHT,
      FIRE_HYDRANT_WIDTH,
      5,
      FIRE_HYDRANT_COLOR,
    );
    const nozzle = this.scene.add.circle(
      FIRE_HYDRANT_WIDTH * 0.42,
      -FIRE_HYDRANT_HEIGHT * 0.58,
      4,
      FIRE_HYDRANT_COLOR,
    );
    return this.scene.add.container(x, groundY, [body, cap, nozzle]);
  }

  /** A branch hangs across the clearance line without a trunk blocking the duck path. */
  private createLowBranchGameObject(x: number, groundY: number): Phaser.GameObjects.Container {
    const branchY = -OVERHEAD_GAP - OVERHEAD_BAR_HEIGHT * 0.5;
    const branch = this.scene.add.rectangle(0, branchY, OVERHEAD_BAR_WIDTH, 7, TRUNK_COLOR);
    const leaves = [
      this.scene.add.circle(-OVERHEAD_BAR_WIDTH * 0.28, branchY - 6, CANOPY_RADIUS * 0.55, LEAF_COLOR),
      this.scene.add.circle(0, branchY - 8, CANOPY_RADIUS * 0.65, LEAF_COLOR),
      this.scene.add.circle(OVERHEAD_BAR_WIDTH * 0.28, branchY - 5, CANOPY_RADIUS * 0.55, LEAF_COLOR),
    ];
    return this.scene.add.container(x, groundY, [branch, ...leaves]);
  }

  private createAwningGameObject(x: number, groundY: number): Phaser.GameObjects.Container {
    const awningY = -OVERHEAD_GAP - OVERHEAD_BAR_HEIGHT * 0.5;
    const shade = this.scene.add.rectangle(0, awningY, OVERHEAD_BAR_WIDTH, OVERHEAD_BAR_HEIGHT, AWNING_COLOR);
    const stripeWidth = OVERHEAD_BAR_WIDTH / 5;
    const stripes = [-2, 0, 2].map((offset) =>
      this.scene.add.rectangle(
        offset * stripeWidth,
        awningY,
        stripeWidth * 0.55,
        OVERHEAD_BAR_HEIGHT,
        AWNING_STRIPE_COLOR,
      ),
    );
    return this.scene.add.container(x, groundY, [shade, ...stripes]);
  }

  private createStreetBannerGameObject(x: number, groundY: number): Phaser.GameObjects.Container {
    const bannerY = -OVERHEAD_GAP - OVERHEAD_BAR_HEIGHT * 0.5;
    const banner = this.scene.add.rectangle(
      0,
      bannerY,
      OVERHEAD_BAR_WIDTH,
      OVERHEAD_BAR_HEIGHT,
      STREET_BANNER_COLOR,
    );
    const pennantY = bannerY + OVERHEAD_BAR_HEIGHT * 0.5;
    const leftPennant = this.scene.add.triangle(
      -OVERHEAD_BAR_WIDTH * 0.24,
      pennantY,
      -6,
      0,
      6,
      0,
      0,
      8,
      STREET_BANNER_COLOR,
    );
    const rightPennant = this.scene.add.triangle(
      OVERHEAD_BAR_WIDTH * 0.24,
      pennantY,
      -6,
      0,
      6,
      0,
      0,
      8,
      STREET_BANNER_COLOR,
    );
    return this.scene.add.container(x, groundY, [banner, leftPennant, rightPennant]);
  }

  /** Rotate wheel hubs with approach speed so vehicles look like they're rolling. */
  private spinVehicleWheels(delta: number): void {
    const baseDx = (this.options.scrollSpeed * delta) / 1000;
    for (const item of this.items) {
      if (!item.wheelHubs) continue;
      const roll = baseDx * item.scrollMultiplier;
      const degrees = (roll / WHEEL_RADIUS) * Phaser.Math.RAD_TO_DEG;
      for (const hub of item.wheelHubs) hub.angle += degrees;
    }
  }

  private carColor(power: PowerColor | undefined): number {
    if (power === "fire") return FIRE_CAR_COLOR;
    if (power === "water") return WATER_CAR_COLOR;
    return GREY_CAR_COLOR;
  }
}

function assertNeverAppearance(appearance: never): never {
  throw new Error(`Unhandled obstacle appearance: ${String(appearance)}`);
}
