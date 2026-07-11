import { describe, expect, it } from "vitest";
import { buildLevel } from "./Level";

describe("buildLevel", () => {
  it("is deterministic — no procedural/random generation (ADR-0003)", () => {
    expect(buildLevel()).toEqual(buildLevel());
  });

  it("has a defined start and a finite end", () => {
    const level = buildLevel();
    expect(level.length).toBeGreaterThan(0);
    expect(Number.isFinite(level.length)).toBe(true);
  });

  it("is roughly a long Geometry Dash level in length (~2-4 minutes at 220px/s)", () => {
    const level = buildLevel();
    const SCROLL_SPEED = 220;
    const seconds = level.length / SCROLL_SPEED;
    expect(seconds).toBeGreaterThanOrEqual(100);
    expect(seconds).toBeLessThanOrEqual(260);
  });

  it("places the Checkpoint immediately before the Final Boss marker (ADR-0004)", () => {
    const level = buildLevel();
    expect(level.bossMarker).toBeGreaterThan(level.checkpoint);
    expect(level.bossMarker - level.checkpoint).toBeLessThan(300);
  });

  it("keeps the Checkpoint and Final Boss marker within the Level bounds", () => {
    const level = buildLevel();
    for (const d of [level.checkpoint, level.bossMarker]) {
      expect(d).toBeGreaterThan(0);
      expect(d).toBeLessThan(level.length);
    }
  });

  it("sorts Obstacle events ascending by distance, within bounds", () => {
    const level = buildLevel();
    expect(level.obstacles.length).toBeGreaterThan(0);
    for (let i = 1; i < level.obstacles.length; i++) {
      expect(level.obstacles[i].distance).toBeGreaterThan(level.obstacles[i - 1].distance);
    }
    for (const o of level.obstacles) {
      expect(o.distance).toBeGreaterThanOrEqual(0);
      expect(o.distance).toBeLessThan(level.length);
    }
  });

  it("only ever spawns Power-up Cars in the Road Lane", () => {
    const level = buildLevel();
    const cars = level.obstacles.filter((o) => o.shape === "single" && o.variant.type === "car");
    expect(cars.length).toBeGreaterThan(0);
    for (const car of cars) {
      expect(car.shape === "single" && car.lane).toBe("road");
    }
  });

  it("sorts Collectible events ascending by distance, within bounds", () => {
    const level = buildLevel();
    expect(level.collectibles.length).toBeGreaterThan(0);
    for (let i = 1; i < level.collectibles.length; i++) {
      expect(level.collectibles[i].distance).toBeGreaterThan(level.collectibles[i - 1].distance);
    }
    for (const c of level.collectibles) {
      expect(c.distance).toBeGreaterThanOrEqual(0);
      expect(c.distance).toBeLessThan(level.length);
    }
  });

  it("totalCoins matches the count of Coin (not Heart) collectibles", () => {
    const level = buildLevel();
    const coinCount = level.collectibles.filter((c) => c.kind === "coin").length;
    expect(level.totalCoins).toBe(coinCount);
    expect(level.totalCoins).toBeGreaterThan(0);
  });

  it("includes at least one Heart collectible", () => {
    const level = buildLevel();
    expect(level.collectibles.some((c) => c.kind === "heart")).toBe(true);
  });
});
