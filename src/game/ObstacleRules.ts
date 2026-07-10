import type { PowerColor, VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";

export type ObstacleKind = "ground" | "overhead";
export type CarColor = "red" | "blue" | "grey";
export type Material = "wood" | "electric";

/** Contact with an obstacle requires standing in its Lane — shared precondition for every rule below. */
function sameLane(obstacleLane: Lane, playerLane: Lane): boolean {
  return obstacleLane === playerLane;
}

/**
 * The authoritative dodge rule (see CONTEXT.md: Ground Obstacle is cleared by
 * jumping, Overhead Obstacle by ducking). Kept as a pure function so the
 * mechanic's correctness doesn't depend on pixel-perfect hitbox geometry —
 * Phaser only needs to detect "this obstacle reached the player," this
 * decides the outcome.
 */
export function isCleared(kind: ObstacleKind, state: VerticalState): boolean {
  if (kind === "ground") return state === "jumping";
  return state === "ducking";
}

export interface DamageCheck {
  obstacleLane: Lane;
  obstacleKind: ObstacleKind;
  playerLane: Lane;
  playerState: VerticalState;
}

/**
 * Lane is a precondition for the dodge rule: an obstacle in the other Lane
 * never causes damage, regardless of pose — the player simply isn't there.
 */
export function shouldTakeDamage(check: DamageCheck): boolean {
  if (!sameLane(check.obstacleLane, check.playerLane)) return false;
  return !isCleared(check.obstacleKind, check.playerState);
}

/**
 * Which Power a Power-up Car grants once cleared (see CONTEXT.md: red →
 * Fire, blue → Water, grey → none). Only meaningful for a cleared car — a
 * missed car never grants anything, matching CONTEXT.md's "grey behaves as
 * a plain Ground Obstacle" and, implicitly, a missed red/blue car too.
 */
export function carPowerGranted(carColor: CarColor | undefined): PowerColor | null {
  if (carColor === "red") return "fire";
  if (carColor === "blue") return "water";
  return null;
}

/** Fire destroys Wood, Water destroys Electric — see CONTEXT.md Fire/Water Power. */
export function destroysMaterial(power: PowerColor, material: Material): boolean {
  if (power === "fire") return material === "wood";
  return material === "electric";
}

export interface BlockerCheck {
  obstacleLane: Lane;
  playerLane: Lane;
  material: Material | undefined;
  activePower: PowerColor | null;
}

/**
 * Whether an activated Power destroys a Blocker Obstacle on contact (see
 * CONTEXT.md: Blocker Obstacle). Lane is a precondition, same as
 * shouldTakeDamage — contact requires being in the obstacle's Lane.
 */
export function shouldDestroyBlocker(check: BlockerCheck): boolean {
  if (!check.material || !check.activePower) return false;
  if (!sameLane(check.obstacleLane, check.playerLane)) return false;
  return destroysMaterial(check.activePower, check.material);
}
