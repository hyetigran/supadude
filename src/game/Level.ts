import type { CarColor, Material, ObstacleKind } from "./ObstacleRules";
import type { Lane } from "./Lane";

export type CollectibleKind = "heart" | "coin";

export type ObstacleVariant =
  | { type: "plain" }
  | { type: "car"; carColor: CarColor }
  | { type: "blocker"; material: Material };

/**
 * "pole" is the Light Pole (see CONTEXT.md): a single obstacle spanning the
 * full Ground-to-Overhead height, so neither Jump nor Duck clears it —
 * survivable only by being in the other Lane, or by destroying it with
 * Water Power (its material is always Electric).
 */
export type ObstacleEvent =
  | { distance: number; shape: "single"; lane: Lane; kind: ObstacleKind; variant: ObstacleVariant }
  | { distance: number; shape: "pole"; lane: Lane };

export interface CollectibleEvent {
  distance: number;
  lane: Lane;
  kind: CollectibleKind;
}

export interface Level {
  /** Ascending by distance. */
  obstacles: ObstacleEvent[];
  /** Ascending by distance. */
  collectibles: CollectibleEvent[];
  /** The Checkpoint immediately before the Final Boss (see CONTEXT.md, ADR-0004 — one Boss, not several, so one Checkpoint). */
  checkpoint: number;
  /** The Final Boss's encounter distance (see ADR-0004). */
  bossMarker: number;
  /** Total Level distance in world px (finish line). */
  length: number;
  /** Count of Coin (not Heart) collectibles — the results screen's "collected/total" denominator. */
  totalCoins: number;
}

type ChunkToken =
  | { chunk: "single"; lane: Lane; kind: ObstacleKind }
  | { chunk: "pole"; lane: Lane }
  | { chunk: "blocker"; lane: Lane; kind: ObstacleKind; material: Material }
  | { chunk: "car"; carColor: CarColor }
  | { chunk: "breather"; gap: number }
  | { chunk: "checkpoint" }
  | { chunk: "boss" };

/** Distance (world px) the cursor advances after placing each chunk kind — the pacing knob for that shape. */
const SPACING = {
  single: 420,
  pole: 520,
  blocker: 470,
  car: 540,
} as const;

const CHECKPOINT_TO_BOSS_GAP = 170; // "immediately before" per issue #6
const POST_BOSS_GAP = 700; // breathing room after the Final Boss before the closing stretch to the finish line

/**
 * The authored Level, hand-written as an explicit, fixed token sequence — no
 * Math.random or other runtime source of variation (ADR-0003). 3 Acts of
 * continuous Obstacle/Collectible content run back-to-back, ending in a
 * single Checkpoint immediately followed by the Final Boss (ADR-0004 — a
 * Boss Fight pauses auto-run, so it happens once, near the climax, not
 * repeatedly through the middle of the Level), then a closing stretch to
 * the finish line.
 *
 * The Lawn Lane's obstacle vocabulary is deliberately narrow — only plain
 * Ground (trash can, jump), plain Overhead (tree, duck), and Light Pole
 * (switch Lanes or Water Power) ever appear there, each mapping to exactly
 * one dodge action. Wood/Electric Blocker variants (Fire/Water-destroyable
 * but still Jump/Duck-dodgeable) are Road-Lane-only.
 */
const ACT_1: ChunkToken[] = [
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "breather", gap: 400 },
  { chunk: "pole", lane: "road" },
  { chunk: "single", lane: "lawn", kind: "ground" },
  { chunk: "car", carColor: "grey" },
  { chunk: "single", lane: "lawn", kind: "ground" },
  { chunk: "single", lane: "road", kind: "overhead" },
  { chunk: "breather", gap: 350 },
  { chunk: "car", carColor: "red" },
  { chunk: "pole", lane: "lawn" },
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "blocker", lane: "road", kind: "overhead", material: "electric" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "single", lane: "road", kind: "ground" },
];

const ACT_2: ChunkToken[] = [
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "car", carColor: "blue" },
  { chunk: "blocker", lane: "road", kind: "ground", material: "electric" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "breather", gap: 400 },
  { chunk: "pole", lane: "road" },
  { chunk: "single", lane: "lawn", kind: "ground" },
  { chunk: "single", lane: "road", kind: "overhead" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "car", carColor: "grey" },
  { chunk: "breather", gap: 350 },
  { chunk: "pole", lane: "lawn" },
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "car", carColor: "red" },
];

const ACT_3: ChunkToken[] = [
  { chunk: "car", carColor: "red" },
  { chunk: "blocker", lane: "road", kind: "ground", material: "wood" },
  { chunk: "single", lane: "lawn", kind: "ground" },
  { chunk: "breather", gap: 400 },
  { chunk: "pole", lane: "road" },
  { chunk: "car", carColor: "blue" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "single", lane: "road", kind: "overhead" },
  { chunk: "breather", gap: 350 },
  { chunk: "pole", lane: "lawn" },
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "car", carColor: "grey" },
  { chunk: "blocker", lane: "road", kind: "ground", material: "wood" },
];

const FINAL_STRETCH: ChunkToken[] = [
  { chunk: "single", lane: "road", kind: "ground" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "pole", lane: "road" },
  { chunk: "breather", gap: 400 },
  { chunk: "car", carColor: "grey" },
  { chunk: "single", lane: "lawn", kind: "ground" },
  { chunk: "single", lane: "lawn", kind: "overhead" },
  { chunk: "single", lane: "road", kind: "ground" },
];

const SCRIPT: ChunkToken[] = [
  { chunk: "breather", gap: 600 }, // intro buffer before the first Obstacle
  ...ACT_1,
  ...ACT_2,
  ...ACT_3,
  { chunk: "breather", gap: 1500 }, // tension-building lull before the Checkpoint/Final Boss
  { chunk: "checkpoint" },
  { chunk: "boss" },
  ...FINAL_STRETCH,
];

interface ObstacleTrack {
  obstacles: ObstacleEvent[];
  checkpoint: number;
  bossMarker: number;
  length: number;
}

function buildObstacleTrack(script: ChunkToken[]): ObstacleTrack {
  let cursor = 0;
  const obstacles: ObstacleEvent[] = [];
  let checkpoint: number | undefined;
  let bossMarker: number | undefined;

  for (const token of script) {
    switch (token.chunk) {
      case "single":
        obstacles.push({ distance: cursor, shape: "single", lane: token.lane, kind: token.kind, variant: { type: "plain" } });
        cursor += SPACING.single;
        break;
      case "pole":
        obstacles.push({ distance: cursor, shape: "pole", lane: token.lane });
        cursor += SPACING.pole;
        break;
      case "blocker":
        obstacles.push({
          distance: cursor,
          shape: "single",
          lane: token.lane,
          kind: token.kind,
          variant: { type: "blocker", material: token.material },
        });
        cursor += SPACING.blocker;
        break;
      case "car":
        // Power-up Cars only ever spawn in the Road Lane (see CONTEXT.md Power-up Car).
        obstacles.push({
          distance: cursor,
          shape: "single",
          lane: "road",
          kind: "ground",
          variant: { type: "car", carColor: token.carColor },
        });
        cursor += SPACING.car;
        break;
      case "breather":
        cursor += token.gap;
        break;
      case "checkpoint":
        checkpoint = cursor;
        cursor += CHECKPOINT_TO_BOSS_GAP;
        break;
      case "boss":
        bossMarker = cursor;
        cursor += POST_BOSS_GAP;
        break;
    }
  }

  if (checkpoint === undefined || bossMarker === undefined) {
    // Authored-content invariant, not user input — SCRIPT always has exactly
    // one checkpoint/boss token (ADR-0004), so this can only mean SCRIPT itself was edited wrong.
    throw new Error("Level SCRIPT must include exactly one checkpoint and one boss token");
  }

  return { obstacles, checkpoint, bossMarker, length: cursor };
}

const COIN_STEP = 260;
const COLLECTIBLE_START_BUFFER = 700;
const HEART_EVERY_NTH = 5;

/**
 * A fixed formula over the Level's length, not runtime randomness — same
 * output every call for the same length, which is what ADR-0003's "no
 * procedural generation" is actually ruling out. Every 5th slot is a Heart;
 * the rest are Coins, alternating Lanes.
 */
function buildCollectibleTrack(length: number): CollectibleEvent[] {
  const collectibles: CollectibleEvent[] = [];
  let i = 0;
  for (let distance = COLLECTIBLE_START_BUFFER; distance < length; distance += COIN_STEP, i++) {
    const lane: Lane = i % 2 === 0 ? "road" : "lawn";
    const kind: CollectibleKind = (i + 1) % HEART_EVERY_NTH === 0 ? "heart" : "coin";
    collectibles.push({ distance, lane, kind });
  }
  return collectibles;
}

export function buildLevel(): Level {
  const { obstacles, checkpoint, bossMarker, length } = buildObstacleTrack(SCRIPT);
  const collectibles = buildCollectibleTrack(length);
  const totalCoins = collectibles.filter((c) => c.kind === "coin").length;

  return { obstacles, collectibles, checkpoint, bossMarker, length, totalCoins };
}

export const LEVEL: Level = buildLevel();
