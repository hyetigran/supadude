import { describe, expect, it } from "vitest";
import { mapKeyToAction } from "./KeyBindings";

describe("mapKeyToAction", () => {
  it.each([
    ["Space", "jump"],
    ["ArrowUp", "jump"],
    ["ArrowDown", "duck"],
    ["ArrowLeft", "laneLeft"],
    ["ArrowRight", "laneRight"],
    ["KeyF", "powerActivate"],
    ["KeyE", "punch"],
  ] as const)("maps %s to %s", (key, action) => {
    expect(mapKeyToAction(key)).toBe(action);
  });

  it("returns undefined for an unbound key", () => {
    expect(mapKeyToAction("KeyZ")).toBeUndefined();
  });
});
