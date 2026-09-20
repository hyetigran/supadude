import type { Lane } from "./Lane";
import type { Material, ObstacleKind } from "./ObstacleRules";
import type { PowerColor } from "./PlayerState";

export const OBSTACLE_IDS = [
  "trashCan",
  "awning",
  "fireHydrant",
  "lowBranch",
  "utilityBox",
  "motorcycle",
  "redCar",
  "blueCar",
  "greyCar",
  "streetBanner",
] as const;

export type ObstacleId = (typeof OBSTACLE_IDS)[number];

export type ObstacleAppearance =
  | "trashCan"
  | "awning"
  | "fireHydrant"
  | "lowBranch"
  | "utilityBox"
  | "motorcycle"
  | "car"
  | "streetBanner";

export type ObstacleMotion = "stationary" | "oncoming";

export interface ObstacleDefinition {
  readonly lane: Lane;
  readonly kind: ObstacleKind;
  readonly appearance: ObstacleAppearance;
  readonly material?: Material;
  readonly power?: PowerColor;
  readonly motion: ObstacleMotion;
}

/**
 * The single source of truth for an Obstacle's Lane ownership, dodge rule,
 * visual treatment, and optional interaction. Level events name an entry in
 * this catalog rather than repeating those attributes at every spawn point.
 */
export const OBSTACLE_CATALOG: Readonly<Record<ObstacleId, ObstacleDefinition>> = {
  trashCan: {
    lane: "sidewalk",
    kind: "ground",
    appearance: "trashCan",
    motion: "stationary",
  },
  awning: {
    lane: "sidewalk",
    kind: "overhead",
    appearance: "awning",
    motion: "stationary",
  },
  fireHydrant: {
    lane: "treeLawn",
    kind: "ground",
    appearance: "fireHydrant",
    motion: "stationary",
  },
  lowBranch: {
    lane: "treeLawn",
    kind: "overhead",
    appearance: "lowBranch",
    material: "wood",
    motion: "stationary",
  },
  utilityBox: {
    lane: "treeLawn",
    kind: "ground",
    appearance: "utilityBox",
    material: "electric",
    motion: "stationary",
  },
  motorcycle: {
    lane: "street",
    kind: "ground",
    appearance: "motorcycle",
    motion: "oncoming",
  },
  redCar: {
    lane: "street",
    kind: "ground",
    appearance: "car",
    power: "fire",
    motion: "oncoming",
  },
  blueCar: {
    lane: "street",
    kind: "ground",
    appearance: "car",
    power: "water",
    motion: "oncoming",
  },
  greyCar: {
    lane: "street",
    kind: "ground",
    appearance: "car",
    motion: "oncoming",
  },
  streetBanner: {
    lane: "street",
    kind: "overhead",
    appearance: "streetBanner",
    motion: "stationary",
  },
};
