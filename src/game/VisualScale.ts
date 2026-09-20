/**
 * Shared placeholder proportions so Jump/Duck and Ground/Overhead clearance
 * read against one height contract (see CONTEXT.md).
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
export const FIRE_HYDRANT_WIDTH = 20;
export const FIRE_HYDRANT_HEIGHT = 30;
export const UTILITY_BOX_WIDTH = 26;
export const UTILITY_BOX_HEIGHT = 32;

/**
 * Trunk/canopy clearance line. Must satisfy duckHeight < OVERHEAD_GAP < standHeight
 * (idle bob lifts the head further into the canopy when standing).
 */
export const OVERHEAD_GAP = 48;
export const TRUNK_WIDTH = 8;
export const TRUNK_COLOR = 0x6b4226;
export const CANOPY_RADIUS = 18;
export const OVERHEAD_BAR_WIDTH = 54;
export const OVERHEAD_BAR_HEIGHT = 12;

/** Jump apex ≈ tallest ground obstacle + small clearance (not a floaty leap). */
export const JUMP_CLEARANCE = 16;
export const JUMP_HEIGHT = GROUND_OBSTACLE_HEIGHT + JUMP_CLEARANCE;

/**
 * Vertical neighborhood composition (top → bottom):
 * sky → Sidewalk Lane → Tree Lawn Lane → Street Lane.
 * Ground baselines sit *inside* each lane band so Supa Dude stands in the
 * surface, not balanced on its top edge.
 */
/** Y where the playable neighborhood begins, as a fraction of canvas height. */
export const NEIGHBORHOOD_TOP_RATIO = 0.38;
export const SIDEWALK_LANE_HEIGHT = 70;
export const TREE_LAWN_LANE_HEIGHT = 70;
export const SIDEWALK_GROUND_INSET = 6;
export const TREE_LAWN_GROUND_INSET = 6;
/** How far below the curb the Street baseline sits (feet in the asphalt). */
export const STREET_GROUND_INSET = 92;

/** Final Boss placeholder ≈ 1.6× player; pinned to the Street baseline in GameScene. */
export const BOSS_WIDTH = 50;
export const BOSS_HEIGHT = Math.round(PLAYER_STAND_HEIGHT * 1.6);

export const MARKER_WIDTH = 10;
export const MARKER_HEIGHT = 100;

export const COLLECTIBLE_RADIUS = 9;
export const COLLECTIBLE_HEIGHT_ABOVE_LANE = 36;

/** Draw order: farther Sidewalk under Tree Lawn under nearer Street. */
export const DEPTH_BACKGROUND = 0;
/** Parallax sky decor — above the base sky rect, below Lane props. */
export const DEPTH_SKY_DECOR = 0.5;
export const DEPTH_SIDEWALK = 1;
export const DEPTH_TREE_LAWN = 2;
export const DEPTH_STREET = 3;
export const DEPTH_PLAYER = 4;
export const DEPTH_HUD = 10;

/** Perspective scales for the three Lane bands, farthest to nearest. */
export const SIDEWALK_PERSPECTIVE_SCALE = 0.84;
export const TREE_LAWN_PERSPECTIVE_SCALE = 0.92;
export const STREET_PERSPECTIVE_SCALE = 1;
