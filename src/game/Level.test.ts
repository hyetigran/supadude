import { describe, expect, it } from "vitest";
import { buildLevel } from "./Level";
import { RUNNER_TUNING } from "./Runner";

describe("buildLevel", () => {
  it("is deterministic and finite", () => {
    const level = buildLevel();

    expect(level).toEqual(buildLevel());
    expect(Number.isFinite(level.length)).toBe(true);
  });

  it("builds a roughly 80–180 second authored course at 260 px/sec", () => {
    const seconds = buildLevel().length / 260;

    expect(seconds).toBeGreaterThanOrEqual(80);
    expect(seconds).toBeLessThanOrEqual(180);
  });

  it("keeps every track object inside the Level", () => {
    const level = buildLevel();

    for (const event of [...level.hazards, ...level.solids, ...level.coins]) {
      expect(event.x).toBeGreaterThan(0);
      expect(event.x).toBeLessThan(level.length);
    }
  });

  it("includes suburban obstacles, approaching cars, and both power objects", () => {
    const level = buildLevel();
    const kinds = new Set(level.hazards.map(({ kind }) => kind));

    expect(kinds).toEqual(new Set(["bush", "trashCan", "tree", "basketballHoop"]));
    expect(level.solids.every(({ kind }) => kind === "car")).toBe(true);
    expect(new Set(level.powers?.map(({ kind }) => kind))).toEqual(new Set(["flightPad", "jumpOrb"]));
    expect(level.solids.some(({ height }) => height === 48)).toBe(true);
    expect(level.solids.some(({ height }) => height === 72)).toBe(true);
  });

  it("counts uniquely identified authored Coins", () => {
    const level = buildLevel();

    expect(level.totalCoins).toBe(level.coins.length);
    expect(level.totalCoins).toBeGreaterThan(0);
    expect(new Set(level.coins.map(({ id }) => id)).size).toBe(level.coins.length);
  });

  it("sustains at least one obstacle encounter per second on average", () => {
    const level = buildLevel();
    // A block with spikes on top is one encounter, not two.
    const encounters = new Set([...level.hazards, ...level.solids, ...(level.powers ?? [])].map(({ x }) => x));
    const seconds = level.length / RUNNER_TUNING.runSpeed;

    expect(encounters.size / seconds).toBeGreaterThanOrEqual(1);
  });

  it("keeps recovery gaps short, including room to land after flight", () => {
    const level = buildLevel();
    const geometry = [...level.hazards, ...level.solids, ...(level.powers ?? []).map((power) => ({ ...power, width: 64 }))]
      .map(({ x, width }) => ({ start: x - width / 2, end: x + width / 2 }))
      .sort((a, b) => a.start - b.start);
    let previousEnd = geometry[0].end;

    for (const object of geometry.slice(1)) {
      expect((object.start - previousEnd) / RUNNER_TUNING.runSpeed).toBeLessThanOrEqual(1.75);
      previousEnd = Math.max(previousEnd, object.end);
    }
  });
});
