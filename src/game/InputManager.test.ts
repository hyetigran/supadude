import { describe, expect, it, vi } from "vitest";
import { InputManager } from "./InputManager";

describe("InputManager", () => {
  it("calls a listener registered for an action when that action is triggered", () => {
    const input = new InputManager();
    const onJump = vi.fn();
    input.on("jump", onJump);

    input.trigger("jump");

    expect(onJump).toHaveBeenCalledTimes(1);
  });

  it("does not call listeners registered for a different action", () => {
    const input = new InputManager();
    const onJump = vi.fn();
    const onDuck = vi.fn();
    input.on("jump", onJump);
    input.on("duck", onDuck);

    input.trigger("jump");

    expect(onJump).toHaveBeenCalledTimes(1);
    expect(onDuck).not.toHaveBeenCalled();
  });

  it("supports multiple listeners on the same action", () => {
    const input = new InputManager();
    const first = vi.fn();
    const second = vi.fn();
    input.on("punch", first);
    input.on("punch", second);

    input.trigger("punch");

    expect(first).toHaveBeenCalledTimes(1);
    expect(second).toHaveBeenCalledTimes(1);
  });

  it("stops calling a listener once unsubscribed via the returned function", () => {
    const input = new InputManager();
    const onLaneLeft = vi.fn();
    const unsubscribe = input.on("laneLeft", onLaneLeft);

    unsubscribe();
    input.trigger("laneLeft");

    expect(onLaneLeft).not.toHaveBeenCalled();
  });

  it("stops calling a listener once removed via off", () => {
    const input = new InputManager();
    const onPowerActivate = vi.fn();
    input.on("powerActivate", onPowerActivate);

    input.off("powerActivate", onPowerActivate);
    input.trigger("powerActivate");

    expect(onPowerActivate).not.toHaveBeenCalled();
  });

  it("triggering an action with no listeners does not throw", () => {
    const input = new InputManager();
    expect(() => input.trigger("laneRight")).not.toThrow();
  });
});
