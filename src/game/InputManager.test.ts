import { describe, expect, it, vi } from "vitest";
import { InputManager } from "./InputManager";

describe("InputManager", () => {
  it("fires once on press and exposes held state until release", () => {
    const input = new InputManager();
    const onJump = vi.fn();
    input.on("jump", onJump);

    input.press("jump");
    input.press("jump");

    expect(onJump).toHaveBeenCalledTimes(1);
    expect(input.isHeld("jump")).toBe(true);

    input.release("jump");
    expect(input.isHeld("jump")).toBe(false);
    expect(input.consumePress("jump")).toBe(true);
    expect(input.consumePress("jump")).toBe(false);
  });

  it("allows a new press after release", () => {
    const input = new InputManager();
    const onPause = vi.fn();
    input.on("pause", onPause);

    input.trigger("pause");
    input.trigger("pause");

    expect(onPause).toHaveBeenCalledTimes(2);
  });

  it("keeps an Action held until every physical source releases", () => {
    const input = new InputManager();

    input.press("jump", "Space");
    input.press("jump", "ArrowUp");
    input.release("jump", "Space");

    expect(input.isHeld("jump")).toBe(true);

    input.release("jump", "ArrowUp");
    expect(input.isHeld("jump")).toBe(false);
  });

  it("can clear a UI dismissal gesture without leaving a buffered Jump", () => {
    const input = new InputManager();
    input.press("jump", "pointer-1");

    input.clear("jump");

    expect(input.isHeld("jump")).toBe(false);
    expect(input.consumePress("jump")).toBe(false);
  });

  it("clears all held sources when focus is lost", () => {
    const input = new InputManager();
    input.press("jump", "Space");
    input.press("pause", "KeyP");

    input.clearAll();

    expect(input.isHeld("jump")).toBe(false);
    expect(input.isHeld("pause")).toBe(false);
    expect(input.consumePress("jump")).toBe(false);
  });

  it("keeps shooting separate from Jump and ignores keyboard repeat", () => {
    const input = new InputManager();
    input.press("shoot", "KeyF");
    expect(input.consumePress("shoot")).toBe(true);
    input.press("shoot", "KeyF");
    expect(input.consumePress("shoot")).toBe(false);
    expect(input.isHeld("jump")).toBe(false);
    input.release("shoot", "KeyF");
    input.trigger("shoot");
    expect(input.consumePress("shoot")).toBe(true);
    input.clearAll();
    expect(input.consumePress("shoot")).toBe(false);
  });

  it("stops calling a listener after unsubscribe", () => {
    const input = new InputManager();
    const onJump = vi.fn();
    const unsubscribe = input.on("jump", onJump);

    unsubscribe();
    input.trigger("jump");

    expect(onJump).not.toHaveBeenCalled();
  });
});
