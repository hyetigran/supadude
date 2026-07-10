import { describe, expect, it } from "vitest";
import { carPowerGranted, destroysMaterial, isCleared, shouldDestroyBlocker, shouldTakeDamage } from "./ObstacleRules";

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
      shouldTakeDamage({ obstacleLane: "road", obstacleKind: "ground", playerLane: "road", playerState: "grounded" }),
    ).toBe(true);
  });

  it("is false for a same-lane Ground Obstacle while jumping", () => {
    expect(
      shouldTakeDamage({ obstacleLane: "road", obstacleKind: "ground", playerLane: "road", playerState: "jumping" }),
    ).toBe(false);
  });

  it("is true for a same-lane Overhead Obstacle while grounded", () => {
    expect(
      shouldTakeDamage({
        obstacleLane: "lawn",
        obstacleKind: "overhead",
        playerLane: "lawn",
        playerState: "grounded",
      }),
    ).toBe(true);
  });

  it("is false for a same-lane Overhead Obstacle while ducking", () => {
    expect(
      shouldTakeDamage({
        obstacleLane: "lawn",
        obstacleKind: "overhead",
        playerLane: "lawn",
        playerState: "ducking",
      }),
    ).toBe(false);
  });

  it("is false whenever the obstacle's Lane differs from the player's, regardless of pose", () => {
    expect(
      shouldTakeDamage({ obstacleLane: "road", obstacleKind: "ground", playerLane: "lawn", playerState: "grounded" }),
    ).toBe(false);
    expect(
      shouldTakeDamage({
        obstacleLane: "lawn",
        obstacleKind: "overhead",
        playerLane: "road",
        playerState: "grounded",
      }),
    ).toBe(false);
  });
});

describe("carPowerGranted", () => {
  it("grants Fire Power for a red car", () => {
    expect(carPowerGranted("red")).toBe("fire");
  });

  it("grants Water Power for a blue car", () => {
    expect(carPowerGranted("blue")).toBe("water");
  });

  it("grants nothing for a grey car", () => {
    expect(carPowerGranted("grey")).toBeNull();
  });

  it("grants nothing when the obstacle isn't a car at all", () => {
    expect(carPowerGranted(undefined)).toBeNull();
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
      shouldDestroyBlocker({ obstacleLane: "road", playerLane: "road", material: "wood", activePower: "fire" }),
    ).toBe(true);
  });

  it("is false when the Power doesn't match the material", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "road", playerLane: "road", material: "wood", activePower: "water" }),
    ).toBe(false);
  });

  it("is false when no Power is active", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "road", playerLane: "road", material: "wood", activePower: null }),
    ).toBe(false);
  });

  it("is false when the obstacle has no material at all", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "road", playerLane: "road", material: undefined, activePower: "fire" }),
    ).toBe(false);
  });

  it("is false when the obstacle's Lane differs from the player's, even with a matching active Power", () => {
    expect(
      shouldDestroyBlocker({ obstacleLane: "lawn", playerLane: "road", material: "wood", activePower: "fire" }),
    ).toBe(false);
  });
});
