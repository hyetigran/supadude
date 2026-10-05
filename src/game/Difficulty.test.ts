import { describe, expect, it } from "vitest";
import { tuningForDifficulty } from "./Difficulty";
import { Runner, RUNNER_TUNING } from "./Runner";
import type { Level } from "./Level";

const level: Level = { length: 2000, hazards: [], solids: [], coins: [], totalCoins: 0 };

describe("difficulty", () => {
  it("keeps Normal unchanged and makes Hard 23% faster", () => {
    const normal = new Runner(level, tuningForDifficulty("normal"));
    const hard = new Runner(level, tuningForDifficulty("hard"));
    const normalFrame = normal.step(100, { jumpHeld: true });
    const hardFrame = hard.step(100, { jumpHeld: true });
    expect(tuningForDifficulty("normal")).toEqual(RUNNER_TUNING);
    expect(hardFrame.distance / normalFrame.distance).toBeCloseTo(1.23);
    expect(hardFrame.altitude).toBeCloseTo(normalFrame.altitude);
  });

  it("preserves the selected speed across automatic retries", () => {
    const runner = new Runner({ ...level, hazards: [{ id: "bin", kind: "trashCan", x: 60, bottom: 0, width: 30, height: 30 }] }, tuningForDifficulty("hard"));
    let frame = runner.step(0, { jumpHeld: false });
    while (frame.attempt === 1) frame = runner.step(10, { jumpHeld: false });
    const distance = frame.distance;
    const after = runner.step(100, { jumpHeld: true });
    expect(after.distance - distance).toBeCloseTo(31.98);
  });
});
