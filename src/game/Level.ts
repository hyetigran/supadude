export type HazardKind = "spike" | "doubleSpike" | "tripleSpike" | "bush" | "trashCan" | "tree" | "basketballHoop";

export interface HazardEvent {
  id: string;
  /** World-space center x. */
  x: number;
  /** Height above the implicit ground where the hazard begins. */
  bottom: number;
  width: number;
  height: number;
  kind: HazardKind;
}

export type CarPower = "fire" | "water";

export interface SolidEvent {
  power?: CarPower;
  kind?: "car";
  id: string;
  /** World-space center x. */
  x: number;
  width: number;
  height: number;
}

export interface CoinEvent {
  id: string;
  x: number;
  /** World-space center height above the implicit ground. */
  altitude: number;
}

export interface PowerEvent {
  id: string;
  x: number;
  altitude: number;
  kind: "flightPad" | "jumpOrb";
}

/** Road surface sits below the sidewalk; roofs remain part of the same jump path. */
export const ROAD_DROP = 24;
export function solidBottom(solid: SolidEvent): number {
  return solid.kind === "car" ? -ROAD_DROP : 0;
}
export function solidTop(solid: SolidEvent): number {
  return solidBottom(solid) + solid.height;
}

/** Cars approach as the player enters their neighborhood; shared by physics and rendering. */
export function solidWorldX(solid: SolidEvent, distance: number): number {
  return solid.x + (solid.kind === "car" ? Math.max(-120, Math.min(120, (solid.x - distance) * 0.22)) : 0);
}

export interface Level {
  powers?: readonly PowerEvent[];
  hazards: readonly HazardEvent[];
  solids: readonly SolidEvent[];
  coins: readonly CoinEvent[];
  /** Finish-line x in world pixels. */
  length: number;
  totalCoins: number;
}

type CourseToken =
  | { type: "flightPad" }
  | { type: "jumpOrb" }
  | { type: "tree" }
  | { type: "basketballHoop" }
  | { type: "gap"; width: number }
  | { type: "garden"; count: 1 | 2 | 3; coin?: boolean }
  | { type: "car"; width: 64 | 96 | 128 | 160; height: 48 | 72; coin?: boolean };

const GARDEN_UNIT_WIDTH = 30;
const GARDEN_HEIGHT = 30;
const START_CLEARANCE = 520;
const FINISH_CLEARANCE = 360;

// Introduce each shape quickly, then leave the tutorial behind.
const INTRO: readonly CourseToken[] = [
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 240 },
  { type: "garden", count: 2 },
  { type: "gap", width: 210 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 190 },
  { type: "garden", count: 1 },
  { type: "gap", width: 180 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 230 },
  { type: "car", width: 128, height: 48, coin: true },
  { type: "gap", width: 200 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 190 },
  { type: "garden", count: 1 },
];

// Alternate short and long beats; close bin pairs share one jump.
const RHYTHM: readonly CourseToken[] = [
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 150 },
  { type: "garden", count: 1 },
  { type: "gap", width: 200 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 140 },
  { type: "garden", count: 2 },
  { type: "gap", width: 210 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 230 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 150 },
  { type: "garden", count: 3 },
  { type: "gap", width: 200 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 220 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 150 },
  { type: "garden", count: 2 },
];

// Land on car roofs, then jump again to clear the hedges at the exit.
const STEPS: readonly CourseToken[] = [
  { type: "car", width: 128, height: 48, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 210 },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3 },
  { type: "gap", width: 200 },
  { type: "car", width: 160, height: 48, coin: true },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 180 },
  { type: "garden", count: 2 },
  { type: "gap", width: 170 },
  { type: "car", width: 64, height: 48, coin: true },
  { type: "gap", width: 180 },
  { type: "car", width: 128, height: 72, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 210 },
  { type: "garden", count: 3 },
  { type: "gap", width: 180 },
  { type: "garden", count: 1 },
];

// Mix paired bins with approaching traffic to change the takeoff timing.
const SYNCOPATION: readonly CourseToken[] = [
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 140 },
  { type: "garden", count: 2 },
  { type: "gap", width: 220 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 180 },
  { type: "garden", count: 2 },
  { type: "gap", width: 150 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 210 },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 160 },
  { type: "garden", count: 3 },
  { type: "gap", width: 190 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 190 },
  { type: "garden", count: 2 },
];

// Linked car roofs and hedge exits reward controlled landings.
const ROOFTOPS: readonly CourseToken[] = [
  { type: "car", width: 160, height: 48, coin: true },
  { type: "car", width: 128, height: 72, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 210 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 2 },
  { type: "gap", width: 180 },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 190 },
  { type: "car", width: 160, height: 48, coin: true },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 160 },
  { type: "garden", count: 3 },
  { type: "gap", width: 180 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 2 },
];

// Sustain the rhythm across hedges, bins, and approaching traffic.
const GAUNTLET: readonly CourseToken[] = [
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 140 },
  { type: "garden", count: 2 },
  { type: "gap", width: 180 },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 190 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 140 },
  { type: "garden", count: 2 },
  { type: "gap", width: 190 },
  { type: "car", width: 160, height: 48, coin: true },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3, coin: true },
];

// A final rhythm change before the closing combinations.
const PRESSURE: readonly CourseToken[] = [
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 160 },
  { type: "car", width: 96, height: 72, coin: true },
  { type: "gap", width: 180 },
  { type: "garden", count: 3 },
  { type: "gap", width: 150 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 190 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 180 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 200 },
  { type: "garden", count: 3, coin: true },
];

// Combine the learned patterns with only short recovery windows.
const FINALE: readonly CourseToken[] = [
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3 },
  { type: "gap", width: 140 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 180 },
  { type: "car", width: 160, height: 48, coin: true },
  { type: "car", width: 128, height: 72, coin: true },
  { type: "gap", width: 100 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 190 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 1 },
  { type: "gap", width: 40 },
  { type: "garden", count: 1, coin: true },
  { type: "gap", width: 170 },
  { type: "garden", count: 3, coin: true },
  { type: "gap", width: 140 },
  { type: "garden", count: 2 },
  { type: "gap", width: 180 },
  { type: "garden", count: 3, coin: true },
];

// First teach landing on a trampoline, then flying above a short traffic queue.
const FLIGHT_STREET: readonly CourseToken[] = [
  { type: "flightPad" },
  { type: "gap", width: 220 },
  { type: "car", width: 96, height: 48, coin: true },
  { type: "gap", width: 110 },
  { type: "car", width: 128, height: 72, coin: true },
  { type: "gap", width: 110 },
  { type: "car", width: 96, height: 48, coin: true },
];

const ORB_GARDEN: readonly CourseToken[] = [
  { type: "jumpOrb" },
  { type: "gap", width: 110 },
  { type: "car", width: 128, height: 72, coin: true },
  { type: "gap", width: 260 },
  { type: "tree" },
  { type: "gap", width: 240 },
  { type: "garden", count: 2, coin: true },
  { type: "gap", width: 240 },
  { type: "basketballHoop" },
  { type: "gap", width: 240 },
  { type: "jumpOrb" },
  { type: "gap", width: 110 },
  { type: "car", width: 128, height: 72, coin: true },
];

/** Fixed phrases progress from isolated jumps to linked combinations. */
const SCRIPT: readonly CourseToken[] = [
  ...INTRO,
  { type: "gap", width: 320 },
  ...FLIGHT_STREET,
  { type: "gap", width: 440 },
  ...RHYTHM,
  { type: "gap", width: 320 },
  ...STEPS,
  { type: "gap", width: 260 },
  ...SYNCOPATION,
  { type: "gap", width: 260 },
  ...ORB_GARDEN,
  { type: "gap", width: 300 },
  ...ROOFTOPS,
  { type: "gap", width: 260 },
  ...GAUNTLET,
  { type: "gap", width: 260 },
  ...FLIGHT_STREET,
  { type: "gap", width: 440 },
  ...PRESSURE,
  { type: "gap", width: 260 },
  ...FINALE,
];

export function buildLevel(script: readonly CourseToken[] = SCRIPT): Level {
  const powers: PowerEvent[] = [];
  const hazards: HazardEvent[] = [];
  const solids: SolidEvent[] = [];
  const coins: CoinEvent[] = [];
  let cursor = START_CLEARANCE;
  let hazardIndex = 0;
  let solidIndex = 0;
  let coinIndex = 0;

  const addCoin = (x: number, altitude: number): void => {
    coins.push({ id: `coin-${coinIndex++}`, x, altitude });
  };

  for (const token of script) {
    if (token.type === "gap") {
      cursor += token.width;
      continue;
    }

    if (token.type === "flightPad" || token.type === "jumpOrb") {
      powers.push({ id: `power-${powers.length}`, x: cursor + 32, altitude: token.type === "flightPad" ? 12 : 104, kind: token.type });
      cursor += 64;
      continue;
    }
    if (token.type === "tree" || token.type === "basketballHoop") {
      hazards.push({ id: `hazard-${hazardIndex++}`, x: cursor + 55, bottom: 44, width: 110, height: 92, kind: token.type });
      cursor += 110;
      continue;
    }

    if (token.type === "garden") {
      const width = GARDEN_UNIT_WIDTH * token.count;
      const x = cursor + width / 2;
      hazards.push({
        id: `hazard-${hazardIndex++}`,
        x,
        bottom: 0,
        width,
        height: GARDEN_HEIGHT,
        kind: token.count === 1 ? "trashCan" : "bush",
      });
      if (token.coin) addCoin(x, 88);
      cursor += width;
      continue;
    }

    const x = cursor + token.width / 2;
    const power: CarPower | undefined = solidIndex % 4 === 0 ? "fire" : solidIndex % 4 === 1 ? "water" : undefined;
    solids.push({ id: `solid-${solidIndex++}`, x, width: token.width, height: token.height, kind: "car", power });

    if (token.coin) addCoin(x, token.height + 54);
    cursor += token.width;
  }

  const length = cursor + FINISH_CLEARANCE;
  return { hazards, solids, coins, powers, length, totalCoins: coins.length };
}

export const LEVEL = buildLevel();
