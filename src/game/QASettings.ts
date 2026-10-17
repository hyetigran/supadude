import { LEVEL, type HazardKind, type Level } from "./Level";
import { tuningForDifficulty, type Difficulty } from "./Difficulty";

export const OBSTACLE_OPTIONS = [
  ["bush", "Bushes"], ["trashCan", "Trash cans"], ["fireHydrant", "Fire hydrants"],
  ["tree", "Overhead trees"], ["fallenTree", "Fallen trees"],
  ["constructionPit", "Construction pits"], ["basketballHoop", "Basketball hoops"],
] as const;

export interface QASettings {
  robbers: boolean;
  robberCount: number;
  speed: number;
  jumpHeight: number;
  gravity: number;
  frequency: number;
  hazards: HazardKind[];
  cars: boolean;
  flightPads: boolean;
  jumpOrbs: boolean;
}

export function defaultQASettings(): QASettings {
  return { robbers: true, robberCount: 2, speed: 1, jumpHeight: 1, gravity: 1, frequency: 1,
    hazards: OBSTACLE_OPTIONS.map(([kind]) => kind), cars: true, flightPads: true, jumpOrbs: true };
}

export function qaTuning(settings: QASettings, difficulty: Difficulty) {
  const base = tuningForDifficulty(difficulty);
  return { ...base, runSpeed: base.runSpeed * settings.speed, gravity: base.gravity * settings.gravity,
    jumpVelocity: base.jumpVelocity * Math.sqrt(settings.jumpHeight * settings.gravity) };
}

export function qaLevel(settings: QASettings, source: Level = LEVEL): Level {
  const position = <T extends { x: number }>(item: T): T => ({ ...item, x: item.x / settings.frequency });
  return { ...source, battles: settings.robbers ? source.battles?.map((battle) => ({ ...position(battle), robberCount: settings.robberCount })) : [], length: source.length / settings.frequency,
    hazards: source.hazards.filter(({ kind }) => settings.hazards.includes(kind)).map(position),
    solids: settings.cars ? source.solids.map(position) : [],
    coins: source.coins.map(position),
    powers: source.powers?.filter(({ kind }) => kind === "flightPad" ? settings.flightPads : settings.jumpOrbs).map(position) };
}
