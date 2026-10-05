import { describe, expect, it } from "vitest";
import { mapKeyToAction } from "./KeyBindings";

describe("mapKeyToAction", () => {
  it.each([
    ["Space", "jump"],
    ["ArrowUp", "jump"],
    ["KeyF", "shoot"],
    ["KeyX", "shoot"],
    ["Escape", "pause"],
    ["KeyP", "pause"],
  ] as const)("maps %s to %s", (key, action) => {
    expect(mapKeyToAction(key)).toBe(action);
  });

  it.each(["ArrowDown", "ArrowLeft", "ArrowRight", "KeyE"])("leaves removed control %s unbound", (key) => {
    expect(mapKeyToAction(key)).toBeUndefined();
  });
});
