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

  it("has exactly 3 Checkpoints", () => {
    const level = buildLevel();
    expect(level.checkpoints).toHaveLength(3);
  });

  it("has exactly 3 Mini-Boss placeholder markers", () => {
    const level = buildLevel();
    expect(level.bossMarkers).toHaveLength(3);
  });

  it("places each Checkpoint immediately before its Mini-Boss marker", () => {
    const level = buildLevel();
    level.checkpoints.forEach((checkpointDistance, i) => {
      const bossDistance = level.bossMarkers[i];
      expect(bossDistance).toBeGreaterThan(checkpointDistance);
      expect(bossDistance - checkpointDistance).toBeLessThan(300);
    });
  });

  it("orders Checkpoints and boss markers strictly ascending", () => {
    const level = buildLevel();
    for (let i = 1; i < level.checkpoints.length; i++) {
      expect(level.checkpoints[i]).toBeGreaterThan(level.checkpoints[i - 1]);
    }
    for (let i = 1; i < level.bossMarkers.length; i++) {
      expect(level.bossMarkers[i]).toBeGreaterThan(level.bossMarkers[i - 1]);
    }
  });

  it("keeps all Checkpoints and boss markers within the Level bounds", () => {
    const level = buildLevel();
    for (const d of [...level.checkpoints, ...level.bossMarkers]) {
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
