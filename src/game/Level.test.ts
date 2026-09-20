import { describe, expect, it } from "vitest";
import { LANES } from "./Lane";
import { buildLevel } from "./Level";
import { OBSTACLE_CATALOG, OBSTACLE_IDS } from "./ObstacleCatalog";

describe("buildLevel", () => {
  it("is deterministic — no procedural/random generation (ADR-0003)", () => {
    expect(buildLevel()).toEqual(buildLevel());
  });

  it("has a finite 100–260 second authored length at the game scroll speed", () => {
    const level = buildLevel();
    const seconds = level.length / 220;

    expect(Number.isFinite(level.length)).toBe(true);
    expect(seconds).toBeGreaterThanOrEqual(100);
    expect(seconds).toBeLessThanOrEqual(260);
  });

  it("places one Checkpoint immediately before the Final Boss and keeps both within bounds", () => {
    const level = buildLevel();

    expect(level.checkpoint).toBeGreaterThan(0);
    expect(level.bossMarker).toBeGreaterThan(level.checkpoint);
    expect(level.bossMarker - level.checkpoint).toBeLessThan(300);
    expect(level.bossMarker).toBeLessThan(level.length);
  });

  it("keeps a closing obstacle stretch after the Final Boss", () => {
    const level = buildLevel();

    expect(level.obstacles.some((obstacle) => obstacle.distance < level.checkpoint)).toBe(true);
    expect(level.obstacles.some((obstacle) => obstacle.distance > level.bossMarker)).toBe(true);
  });

  it("sorts Obstacle events nondecreasing by distance and keeps them within bounds", () => {
    const level = buildLevel();

    expect(level.obstacles.length).toBeGreaterThan(0);
    for (let i = 1; i < level.obstacles.length; i++) {
      expect(level.obstacles[i].distance).toBeGreaterThanOrEqual(level.obstacles[i - 1].distance);
    }
    for (const obstacle of level.obstacles) {
      expect(obstacle.distance).toBeGreaterThanOrEqual(0);
      expect(obstacle.distance).toBeLessThan(level.length);
    }
  });

  it("authors one or two Obstacles per beat without repeating a Lane", () => {
    const level = buildLevel();
    const beats = new Map<number, typeof level.obstacles>();

    for (const obstacle of level.obstacles) {
      const beat = beats.get(obstacle.distance) ?? [];
      beat.push(obstacle);
      beats.set(obstacle.distance, beat);
    }

    for (const beat of beats.values()) {
      expect(beat.length).toBeGreaterThanOrEqual(1);
      expect(beat.length).toBeLessThanOrEqual(2);

      const lanes = beat.map(({ obstacle }) => OBSTACLE_CATALOG[obstacle].lane);
      expect(new Set(lanes).size).toBe(lanes.length);
    }
  });

  it("represents all three Lanes and every catalogued Obstacle", () => {
    const level = buildLevel();
    const obstacleIds = new Set(level.obstacles.map(({ obstacle }) => obstacle));
    const lanes = new Set(level.obstacles.map(({ obstacle }) => OBSTACLE_CATALOG[obstacle].lane));

    expect([...obstacleIds].sort()).toEqual([...OBSTACLE_IDS].sort());
    expect(lanes).toEqual(new Set(LANES));
  });

  it("sorts Collectible events ascending by distance and keeps them within bounds", () => {
    const level = buildLevel();

    expect(level.collectibles.length).toBeGreaterThan(0);
    for (let i = 1; i < level.collectibles.length; i++) {
      expect(level.collectibles[i].distance).toBeGreaterThan(level.collectibles[i - 1].distance);
    }
    for (const collectible of level.collectibles) {
      expect(collectible.distance).toBeGreaterThanOrEqual(0);
      expect(collectible.distance).toBeLessThan(level.length);
    }
  });

  it("cycles Collectibles through Sidewalk, Tree Lawn, and Street", () => {
    const level = buildLevel();
    const firstTwoCycles = level.collectibles.slice(0, LANES.length * 2).map(({ lane }) => lane);

    expect(firstTwoCycles).toEqual([...LANES, ...LANES]);
  });

  it("counts Coins separately from Hearts", () => {
    const level = buildLevel();
    const coinCount = level.collectibles.filter(({ kind }) => kind === "coin").length;

    expect(level.totalCoins).toBe(coinCount);
    expect(level.totalCoins).toBeGreaterThan(0);
    expect(level.collectibles.some(({ kind }) => kind === "heart")).toBe(true);
  });
});
