import type { BossAttackKind } from "./BossFight";

export interface BossConfig {
  name: string;
  attackSequence: readonly BossAttackKind[];
  color: number;
}

/**
 * Per-Mini-Boss content: a distinct, fixed attack pattern for each of the 3
 * encounters (see CONTEXT.md Mini-Boss), all driven by the same Boss Fight
 * system (BossFight.ts/BossFightController.ts) — no new mechanics per boss,
 * only the authored attack sequence and cosmetic color differ (issue #8:
 * "reusing the Boss Fight system... no new systems, this is content
 * authoring"). Indexed to line up with LEVEL.bossMarkers.
 */
export const BOSSES: readonly BossConfig[] = [
  {
    name: "Boss #1",
    attackSequence: ["ground", "overhead", "overhead", "ground", "ground"],
    color: 0x6b21a8,
  },
  {
    name: "Boss #2",
    attackSequence: ["overhead", "overhead", "ground", "overhead"],
    color: 0x1d4ed8,
  },
  {
    name: "Boss #3",
    attackSequence: ["ground", "ground", "overhead", "ground", "overhead", "overhead"],
    color: 0xb91c1c,
  },
];
