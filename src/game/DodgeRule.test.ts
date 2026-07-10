import { describe, expect, it } from "vitest";
import { isCleared, shouldTakeDamage } from "./DodgeRule";

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
