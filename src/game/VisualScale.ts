/** Single side-view ground plane. */
export const GROUND_Y_RATIO = 0.82;

/** The icon is deliberately larger than its collision body for forgiving play. */
export const PLAYER_SIZE = 38;
export const PLAYER_SHADOW_WIDTH = 36;
export const PLAYER_SHADOW_HEIGHT = 8;

export const COIN_RADIUS = 10;

export const DEPTH_BACKGROUND = 0;
export const DEPTH_SCENERY = 1;
export const DEPTH_TRACK = 3;
export const DEPTH_PLAYER = 5;
export const DEPTH_HUD = 10;

export function groundYForViewport(viewportHeight: number): number {
  return Math.round(viewportHeight * GROUND_Y_RATIO);
}
