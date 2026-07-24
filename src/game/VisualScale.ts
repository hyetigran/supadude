/**
 * Shared placeholder proportions so Jump/Duck/lanes and Ground/Overhead/
 * Light Pole clearance read against one height contract (see CONTEXT.md).
 * Art integration should replace these with atlas metrics, not re-tune
 * each field independently.
 */

/** Supa Dude standing height from feet to top of head (px). */
export const PLAYER_STAND_HEIGHT = 68;
export const PLAYER_HEAD_RADIUS = 11;
export const PLAYER_BODY_WIDTH = 6;
/** Body column from feet up to neck; head sits on top → total ≈ PLAYER_STAND_HEIGHT. */
export const PLAYER_BODY_HEIGHT = PLAYER_STAND_HEIGHT - PLAYER_HEAD_RADIUS * 2;
export const PLAYER_CAPE_COLOR = 0xd62828;

/** Idle run bob lift (px). Paused during Jump/Duck. */
export const IDLE_BOB_PX = 10;

/** Duck squashes toward feet; must keep duckHeight < OVERHEAD_GAP. */
export const DUCK_SCALE_Y = 0.55;
export const DUCK_HEIGHT = PLAYER_STAND_HEIGHT * DUCK_SCALE_Y;

/** Ground Obstacles ≈ 0.4 × player so Jump clearance reads. */
export const GROUND_OBSTACLE_HEIGHT = 28;
export const TRASH_CAN_WIDTH = 22;
export const TRASH_CAN_HEIGHT = GROUND_OBSTACLE_HEIGHT;
export const MOTORCYCLE_WIDTH = 30;
export const MOTORCYCLE_HEIGHT = 24;
export const CAR_WIDTH = 36;
export const CAR_HEIGHT = 26;

/**
 * Trunk/canopy clearance line. Must satisfy duckHeight < OVERHEAD_GAP < standHeight
 * (idle bob lifts the head further into the canopy when standing).
 */
export const OVERHEAD_GAP = 48;
export const TRUNK_WIDTH = 8;
export const TRUNK_COLOR = 0x6b4226;
export const CANOPY_RADIUS = 18;

/** Light Pole spans Ground-to-Overhead with modest overshoot past the canopy. */
export const POLE_WIDTH = 8;
export const POLE_HEIGHT = OVERHEAD_GAP + CANOPY_RADIUS * 2 + 16;
export const POLE_LAMP_RADIUS = 9;

/** Jump apex ≈ tallest ground obstacle + small clearance (not a floaty leap). */
export const JUMP_CLEARANCE = 16;
export const JUMP_HEIGHT = GROUND_OBSTACLE_HEIGHT + JUMP_CLEARANCE;

/**
 * Vertical neighborhood composition (top → bottom):
 * sky → lawn grass → sidewalk → road (with yellow dashes near the bottom).
 * Ground baselines sit *inside* each lane band so Supa Dude stands in the
 * surface, not balanced on its top edge.
 */
/** Y where lawn grass begins, as a fraction of canvas height. */
export const LAWN_TOP_RATIO = 0.4;
/** Grass strip above the sidewalk. */
export const LAWN_GRASS_HEIGHT = 72;
/** Concrete sidewalk between lawn and road. */
export const SIDEWALK_HEIGHT = 22;
/** How far below the curb the Road baseline sits (feet in the asphalt). */
export const ROAD_GROUND_INSET = 95;
/** How far above the sidewalk bottom the Lawn baseline sits (feet on the walk). */
export const LAWN_GROUND_INSET_FROM_SIDEWALK_BOTTOM = 4;

/** Final Boss placeholder ≈ 1.6× player; pinned to the Road baseline in GameScene. */
export const BOSS_WIDTH = 50;
export const BOSS_HEIGHT = Math.round(PLAYER_STAND_HEIGHT * 1.6);

export const MARKER_WIDTH = 10;
export const MARKER_HEIGHT = 100;

export const COLLECTIBLE_RADIUS = 9;
export const COLLECTIBLE_HEIGHT_ABOVE_LANE = 36;

/** Draw order: farther Lawn under nearer Road under player under HUD. */
export const DEPTH_BACKGROUND = 0;
/** Parallax sky decor (clouds, distant skyline) — above the base sky rect, below Lawn props. */
export const DEPTH_SKY_DECOR = 0.5;
export const DEPTH_LAWN = 1;
export const DEPTH_ROAD = 2;
export const DEPTH_PLAYER = 3;
export const DEPTH_HUD = 10;

/** Slight scale-down on Lawn props so Road reads nearer. */
export const LAWN_PERSPECTIVE_SCALE = 0.92;
