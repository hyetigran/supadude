import type { VerticalState } from "./PlayerState";

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
