import { describe, expect, it } from "vitest";
import { destroysMaterial, isCleared, shouldDestroyBlocker, shouldTakeDamage } from "./ObstacleRules";

describe("isCleared", () => {
  it.each([
    ["ground", "jumping", true],
    ["ground", "grounded", false],
    ["ground", "ducking", false],
    ["overhead", "ducking", true],
    ["overhead", "grounded", false],
    ["overhead", "jumping", false],
  ] as const)("kind=%s, state=%s -> %s", (kind, state, expected) => {
    expect(isCleared(kind, state)).toBe(expected);
  });
});

describe("shouldTakeDamage", () => {
  it("is true for a same-lane Ground Obstacle while grounded", () => {
    expect(
      shouldTakeDamage({ obstacleLane: "street", obstacleKind: "ground", playerLane: "street", playerState: "grounded" }),
    ).toBe(true);
  });

  it("is false for a same-lane Ground Obstacle while jumping", () => {
    expect(
      shouldTakeDamage({ obstacleLane: "street", obstacleKind: "ground", playerLane: "street", playerState: "jumping" }),
    ).toBe(false);
  });

  it("is true for a same-lane Overhead Obstacle while grounded", () => {
    expect(
      shouldTakeDamage({
        obstacleLane: "treeLawn",
        obstacleKind: "overhead",
        playerLane: "treeLawn",
        playerState: "grounded",
      }),
    ).toBe(true);
  });

  it("is false for a same-lane Overhead Obstacle while ducking", () => {
    expect(
      shouldTakeDamage({
        obstacleLane: "treeLawn",
        obstacleKind: "overhead",
        playerLane: "treeLawn",
        playerState: "ducking",
      }),
    ).toBe(false);
  });

  it("is false whenever the obstacle's Lane differs from the player's, regardless of pose", () => {
    expect(
      shouldTakeDamage({ obstacleLane: "street", obstacleKind: "ground", playerLane: "treeLawn", playerState: "grounded" }),
    ).toBe(false);
    expect(
      shouldTakeDamage({
        obstacleLane: "treeLawn",
        obstacleKind: "overhead",
        playerLane: "street",
        playerState: "grounded",
      }),
    ).toBe(false);
  });
});

describe("destroysMaterial", () => {
  it("Fire Power destroys Wood", () => {
    expect(destroysMaterial("fire", "wood")).toBe(true);
  });

  it("Fire Power does not destroy Electric", () => {
    expect(destroysMaterial("fire", "electric")).toBe(false);
  });

  it("Water Power destroys Electric", () => {
    expect(destroysMaterial("water", "electric")).toBe(true);
  });

  it("Water Power does not destroy Wood", () => {
    expect(destroysMaterial("water", "wood")).toBe(false);
  });
});

describe("shouldDestroyBlocker", () => {
  it("is true for a same-lane matching material with the matching Power active", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "street", playerLane: "street", material: "wood", activePower: "fire" }),
    ).toBe(true);
  });

  it("is false when the Power doesn't match the material", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "street", playerLane: "street", material: "wood", activePower: "water" }),
    ).toBe(false);
  });

  it("is false when no Power is active", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "street", playerLane: "street", material: "wood", activePower: null }),
    ).toBe(false);
  });

  it("is false when the obstacle has no material at all", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "street", playerLane: "street", material: undefined, activePower: "fire" }),
    ).toBe(false);
  });

  it("is false when the obstacle's Lane differs from the player's, even with a matching active Power", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "treeLawn", playerLane: "street", material: "wood", activePower: "fire" }),
    ).toBe(false);
  });
});
