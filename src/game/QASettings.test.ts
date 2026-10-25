import { describe, expect, it } from "vitest";
import { defaultQASettings, qaLevel, qaTuning } from "./QASettings";
import { Runner } from "./Runner";
import { LEVEL } from "./Level";
import { tuningForDifficulty } from "./Difficulty";

describe("QA settings", () => {
  it("preserves the authored course and difficulty at defaults", () => {
    expect(qaLevel(defaultQASettings())).toEqual(LEVEL);
    expect(qaTuning(defaultQASettings(), "hard")).toEqual(tuningForDifficulty("hard"));
  });
  it("configures robber counts and preserves the two progress milestones", () => {
    const level = qaLevel({ ...defaultQASettings(), robberCount50: 4, robberCount90: 7, frequency: 2 });
    expect(level.battles?.map(({ x, robberCount }) => [x / level.length, robberCount])).toEqual([[0.5, 4], [0.9, 7]]);
    expect(qaLevel({ ...defaultQASettings(), robbers: false }).battles).toEqual([]);
  });
  it("uses three robbers in default 90% practice and respects the QA cap", () => {
    const defaults = qaLevel(defaultQASettings());
    expect(new Runner(defaults, undefined, 0.5).step(0, { jumpHeld: false }).battle?.robbers).toHaveLength(2);
    expect(new Runner(defaults, undefined, 0.9).step(0, { jumpHeld: false }).battle?.robbers).toHaveLength(3);
    expect(qaLevel({ ...defaultQASettings(), robberCount50: 50, robberCount90: 50 }).battles?.map(({ robberCount }) => robberCount)).toEqual([50, 50]);
  });
  it.each([[1, 50], [50, 1]])("uses independent counts %i and %i in practice", (robberCount50, robberCount90) => {
    const level = qaLevel({ ...defaultQASettings(), robberCount50, robberCount90 });
    expect(new Runner(level, undefined, 0.5).step(0, { jumpHeld: false }).battle?.robbers).toHaveLength(robberCount50);
    expect(new Runner(level, undefined, 0.9).step(0, { jumpHeld: false }).battle?.robbers).toHaveLength(robberCount90);
  });
  it("applies Easy to both practice shortcuts and restores Medium by default", () => {
    expect(defaultQASettings().bossDifficulty).toBe("medium");
    const level = qaLevel({ ...defaultQASettings(), bossDifficulty: "easy" });
    expect(level.battles?.every(({ difficulty }) => difficulty === "easy")).toBe(true);
    for (const progress of [0.5, 0.9] as const) {
      expect(new Runner(level, undefined, progress).step(0, { jumpHeld: false }).battle?.difficulty).toBe("easy");
    }
  });

  it("filters obstacle types and power objects without mutating the authored course", () => {
    const level = qaLevel({ ...defaultQASettings(), hazards: ["fireHydrant"], cars: false, flightPads: false, jumpOrbs: false });
    expect(level.hazards.length).toBeGreaterThan(0);
    expect(level.hazards.every(({ kind }) => kind === "fireHydrant")).toBe(true);
    expect(level.solids).toEqual([]);
    expect(level.powers).toEqual([]);
    expect(LEVEL.solids.length).toBeGreaterThan(0);
  });
  it("scales all course positions together for reproducible frequency changes", () => {
    const level = qaLevel({ ...defaultQASettings(), frequency: 2 });
    expect(level.length).toBe(LEVEL.length / 2);
    expect(level.hazards[0].x).toBe(LEVEL.hazards[0].x / 2);
    expect(level.solids[0].x).toBe(LEVEL.solids[0].x / 2);
    expect(level.coins[0].x).toBe(LEVEL.coins[0].x / 2);
    expect(level.powers?.[0].x).toBe(LEVEL.powers![0].x / 2);
  });
  it("adjusts jump height independently of gravity and multiplies difficulty speed", () => {
    const base = tuningForDifficulty("hard");
    const tuning = qaTuning({ ...defaultQASettings(), jumpHeight: 2, gravity: 1.5, speed: 0.5 }, "hard");
    expect(tuning.runSpeed).toBe(base.runSpeed / 2);
    expect(tuning.jumpVelocity ** 2 / (2 * tuning.gravity)).toBeCloseTo(2 * base.jumpVelocity ** 2 / (2 * base.gravity));
  });
});
