import type { VerticalState } from "./PlayerState";

/**
 * Frame-index layout of public/sprites/supa-dude.png — a 4x4 grid of 300x300
 * cells, filled left-to-right/top-to-bottom (see docs/art/supa-dude-sprite-spec.md
 * for the generation spec). Positional, not name-based: an AI-generated sheet
 * has no per-frame metadata, so frame order in the grid *is* the contract.
 */
export const SPRITE_SHEET_KEY = "supa-dude";
export const SPRITE_FRAME_WIDTH = 300;
export const SPRITE_FRAME_HEIGHT = 300;

/** Sheet is exported at 4x (see docs/art/supa-dude-sprite-spec.md) so the game-px scale is 1/4. */
export const SPRITE_DISPLAY_SCALE = 0.25;

export type SpriteAnimKey = "idle" | "run" | "jump" | "duck" | "laneSwitch" | "hit" | "punch";

export interface AnimSpec {
  /** Inclusive frame index range within the spritesheet grid. */
  start: number;
  end: number;
  frameRate: number;
  repeat: number;
}

export const ANIM_SPECS: Record<SpriteAnimKey, AnimSpec> = {
  idle: { start: 0, end: 0, frameRate: 1, repeat: -1 },
  run: { start: 1, end: 6, frameRate: 12, repeat: -1 },
  jump: { start: 7, end: 9, frameRate: 10, repeat: 0 },
  duck: { start: 10, end: 10, frameRate: 1, repeat: 0 },
  laneSwitch: { start: 11, end: 11, frameRate: 1, repeat: 0 },
  hit: { start: 12, end: 12, frameRate: 1, repeat: 0 },
  punch: { start: 13, end: 15, frameRate: 12, repeat: 0 },
};

/** Steady-state pose for a given vertical state — what plays once any transient (laneSwitch/hit/punch) finishes. */
export function animKeyForVerticalState(state: VerticalState): SpriteAnimKey {
  switch (state) {
    case "jumping":
      return "jump";
    case "ducking":
      return "duck";
    case "grounded":
      return "run";
  }
}
