import { describe, expect, it } from "vitest";
import { isCleared } from "./DodgeRule";

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
