import { LANES, type Lane } from "./Lane";
import { OBSTACLE_CATALOG, type ObstacleId } from "./ObstacleCatalog";

export type CollectibleKind = "heart" | "coin";

export interface ObstacleEvent {
  distance: number;
  obstacle: ObstacleId;
}

export interface CollectibleEvent {
  distance: number;
  lane: Lane;
  kind: CollectibleKind;
}

export interface Level {
  /** Nondecreasing by distance; a shared distance represents one authored beat. */
  obstacles: ObstacleEvent[];
  /** Ascending by distance. */
  collectibles: CollectibleEvent[];
  /** The one Checkpoint immediately before the Final Boss. */
  checkpoint: number;
  /** The Final Boss encounter distance. */
  bossMarker: number;
  /** Total Level distance in world px (finish line). */
  length: number;
  /** Coin count used by the results screen's collected/total display. */
  totalCoins: number;
}

type ObstacleBeat = readonly [ObstacleId] | readonly [ObstacleId, ObstacleId];

type ScriptToken =
  | { type: "beat"; obstacles: ObstacleBeat }
  | { type: "breather"; gap: number }
  | { type: "checkpoint" }
  | { type: "boss" };

function beat(...obstacles: ObstacleBeat): ScriptToken {
  return { type: "beat", obstacles };
}

const BEAT_SPACING = 460;
const CHECKPOINT_TO_BOSS_GAP = 170;
const POST_BOSS_GAP = 700;

/**
 * Three continuous acts teach the Sidewalk, Tree Lawn, and Street obstacle
 * vocabularies, then combine two different Lanes on the same beat. The
 * sequence is fixed and hand-authored: no runtime randomness is involved.
 */
const ACT_1: ScriptToken[] = [
  beat("trashCan"),
  beat("awning", "motorcycle"),
  { type: "breather", gap: 400 },
  beat("fireHydrant"),
  beat("greyCar", "lowBranch"),
  beat("utilityBox", "trashCan"),
  beat("motorcycle"),
  { type: "breather", gap: 350 },
  beat("redCar", "awning"),
  beat("streetBanner", "fireHydrant"),
  beat("lowBranch", "trashCan"),
  beat("blueCar"),
  beat("utilityBox", "awning"),
  beat("motorcycle", "lowBranch"),
  beat("greyCar", "fireHydrant"),
];

const ACT_2: ScriptToken[] = [
  beat("fireHydrant", "awning"),
  beat("blueCar", "trashCan"),
  beat("lowBranch"),
  { type: "breather", gap: 400 },
  beat("streetBanner", "utilityBox"),
  beat("trashCan", "motorcycle"),
  beat("awning", "fireHydrant"),
  beat("greyCar"),
  beat("lowBranch", "redCar"),
  { type: "breather", gap: 350 },
  beat("utilityBox", "trashCan"),
  beat("motorcycle", "awning"),
  beat("fireHydrant", "streetBanner"),
  beat("blueCar", "lowBranch"),
];

const ACT_3: ScriptToken[] = [
  beat("redCar", "awning"),
  beat("lowBranch", "trashCan"),
  beat("utilityBox"),
  { type: "breather", gap: 400 },
  beat("blueCar", "fireHydrant"),
  beat("streetBanner", "awning"),
  beat("trashCan", "greyCar"),
  beat("motorcycle", "lowBranch"),
  { type: "breather", gap: 350 },
  beat("utilityBox", "redCar"),
  beat("awning", "fireHydrant"),
  beat("streetBanner", "trashCan"),
  beat("blueCar", "lowBranch"),
  beat("motorcycle", "utilityBox"),
];

/** Closing content after the Boss preserves the existing finish-line structure. */
const FINAL_STRETCH: ScriptToken[] = [
  beat("motorcycle", "awning"),
  beat("lowBranch", "redCar"),
  { type: "breather", gap: 400 },
  beat("greyCar", "fireHydrant"),
  beat("trashCan", "streetBanner"),
  beat("utilityBox", "awning"),
  beat("blueCar", "lowBranch"),
  beat("motorcycle", "trashCan"),
];

const SCRIPT: ScriptToken[] = [
  { type: "breather", gap: 600 },
  ...ACT_1,
  ...ACT_2,
  ...ACT_3,
  { type: "breather", gap: 1500 },
  { type: "checkpoint" },
  { type: "boss" },
  ...FINAL_STRETCH,
];

interface ObstacleTrack {
  obstacles: ObstacleEvent[];
  checkpoint: number;
  bossMarker: number;
  length: number;
}

function buildObstacleTrack(script: readonly ScriptToken[]): ObstacleTrack {
  let cursor = 0;
  const obstacles: ObstacleEvent[] = [];
  let checkpoint: number | undefined;
  let bossMarker: number | undefined;

  for (const token of script) {
    switch (token.type) {
      case "beat": {
        const lanes = token.obstacles.map((id) => OBSTACLE_CATALOG[id].lane);
        if (new Set(lanes).size !== lanes.length) {
          throw new Error(`Obstacle beat at ${cursor} repeats a Lane`);
        }

        for (const obstacle of token.obstacles) {
          obstacles.push({ distance: cursor, obstacle });
        }
        cursor += BEAT_SPACING;
        break;
      }
      case "breather":
        cursor += token.gap;
        break;
      case "checkpoint":
        if (checkpoint !== undefined) throw new Error("Level SCRIPT must include exactly one Checkpoint");
        checkpoint = cursor;
        cursor += CHECKPOINT_TO_BOSS_GAP;
        break;
      case "boss":
        if (checkpoint === undefined) throw new Error("The Checkpoint must appear before the Final Boss");
        if (bossMarker !== undefined) throw new Error("Level SCRIPT must include exactly one Final Boss");
        bossMarker = cursor;
        cursor += POST_BOSS_GAP;
        break;
    }
  }

  if (checkpoint === undefined || bossMarker === undefined) {
    throw new Error("Level SCRIPT must include exactly one Checkpoint and one Final Boss");
  }

  return { obstacles, checkpoint, bossMarker, length: cursor };
}

const COLLECTIBLE_STEP = 260;
const COLLECTIBLE_START_BUFFER = 700;
const HEART_EVERY_NTH = 5;

/** Fixed placement formula; each slot advances to the next of all three Lanes. */
function buildCollectibleTrack(length: number): CollectibleEvent[] {
  const collectibles: CollectibleEvent[] = [];
  let index = 0;

  for (
    let distance = COLLECTIBLE_START_BUFFER;
    distance < length;
    distance += COLLECTIBLE_STEP, index++
  ) {
    const lane = LANES[index % LANES.length];
    const kind: CollectibleKind = (index + 1) % HEART_EVERY_NTH === 0 ? "heart" : "coin";
    collectibles.push({ distance, lane, kind });
  }

  return collectibles;
}

export function buildLevel(): Level {
  const { obstacles, checkpoint, bossMarker, length } = buildObstacleTrack(SCRIPT);
  const collectibles = buildCollectibleTrack(length);
  const totalCoins = collectibles.filter(({ kind }) => kind === "coin").length;

  return { obstacles, collectibles, checkpoint, bossMarker, length, totalCoins };
}

export const LEVEL: Level = buildLevel();
