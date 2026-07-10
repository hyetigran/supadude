import type { VerticalState } from "./PlayerState";
import type { Lane } from "./Lane";

export type ObstacleKind = "ground" | "overhead";

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
  if (check.obstacleLane !== check.playerLane) return false;
  return !isCleared(check.obstacleKind, check.playerState);
}
