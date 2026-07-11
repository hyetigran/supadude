import { describe, expect, it } from "vitest";
import { BOSSES } from "./Bosses";
import { LEVEL } from "./Level";

describe("BOSSES", () => {
  // GameScene indexes BOSSES and LEVEL.bossMarkers in lockstep (nextBossIndex)
  // with nothing in the types enforcing they stay the same length — this is
  // the live cross-check that catches the two authored content sources
  // drifting apart, rather than a hardcoded count that could go stale.
  it("has exactly as many Mini-Bosses as LEVEL has boss markers", () => {
    expect(BOSSES).toHaveLength(LEVEL.bossMarkers.length);
  });

  it("every boss has a non-empty attack sequence", () => {
    for (const boss of BOSSES) {
      expect(boss.attackSequence.length).toBeGreaterThan(0);
    }
  });

  it("every boss's attack sequence is distinct from every other boss's (issue #8 acceptance criteria)", () => {
    for (let i = 0; i < BOSSES.length; i++) {
      for (let j = i + 1; j < BOSSES.length; j++) {
        expect(BOSSES[i].attackSequence).not.toEqual(BOSSES[j].attackSequence);
      }
    }
  });

  it("every boss has a unique name and color", () => {
    const names = BOSSES.map((b) => b.name);
    const colors = BOSSES.map((b) => b.color);
    expect(new Set(names).size).toBe(BOSSES.length);
    expect(new Set(colors).size).toBe(BOSSES.length);
  });
});
