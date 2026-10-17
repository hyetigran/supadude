import { afterEach, describe, expect, it, vi } from "vitest";
import { TouchControls } from "./TouchControls";
import { InputManager } from "./InputManager";

class ElementStub extends EventTarget {
  children: ElementStub[] = [];
  hidden = false;
  disabled = false;
  style = {};
  getBoundingClientRect = () => ({ left: 0, top: 0, width: 104, height: 80 });
  textContent = "";
  className = "";
  classList = { add: vi.fn(), remove: vi.fn(), toggle: vi.fn() };
  setAttribute = vi.fn();
  setPointerCapture = vi.fn();
  remove = vi.fn();
  append(...children: ElementStub[]): void { this.children.push(...children); }
}

function setup(width = 1024) {
  const body = new ElementStub();
  const documentStub = Object.assign(new EventTarget(), { body, createElement: () => new ElementStub() });
  // Model a desktop mouse even when the viewport is tablet-sized.
  const media = { width };
  const windowStub = Object.assign(new EventTarget(), {
    matchMedia: (query: string) => ({
      get matches() {
        return !query.includes("pointer: coarse") && !query.includes("hover: none") && media.width <= 1366;
      },
    }),
  });
  vi.stubGlobal("document", documentStub);
  vi.stubGlobal("window", windowStub);
  vi.stubGlobal("ResizeObserver", class { observe() {} disconnect() {} });
  const input = new InputManager();
  const controls = new TouchControls(input, new ElementStub() as unknown as HTMLCanvasElement);
  const [zone, power] = body.children[0].children;
  const joystick = zone.children[0];
  const pointer = (button: ElementStub, type: string, pointerId: number, clientX = 52): void => {
    button.dispatchEvent(Object.assign(new Event(type), { pointerId, clientX, clientY: 40 }));
  };
  return { input, controls, joystick, zone, power, pointer, windowStub, media };
}

afterEach(() => vi.unstubAllGlobals());

describe("touch controls", () => {
  it("drags between left, neutral and right without triggering Jump", () => {
    const { controls, input, joystick, zone, pointer } = setup();
    controls.update(true, true, null);
    expect(joystick.hidden).toBe(false);
    pointer(zone, "pointerdown", 1, 52);
    pointer(zone, "pointermove", 1, 20);
    expect(input.isHeld("left")).toBe(true);
    pointer(zone, "pointermove", 1, 52);
    expect(input.isHeld("left")).toBe(false);
    pointer(zone, "pointermove", 1, 90);
    expect(input.isHeld("right")).toBe(true);
    expect(input.consumePress("jump")).toBe(false);
    pointer(zone, "pointerup", 1);
    expect(input.isHeld("right")).toBe(false);
    expect(joystick.hidden).toBe(false);
    controls.destroy();
  });

  it("supports screen Jump, movement and powered shooting simultaneously", () => {
    const { controls, input, zone, power, pointer } = setup();
    controls.update(true, true, "fire");
    input.press("jump", "pointer-2");
    pointer(zone, "pointerdown", 1, 52);
    pointer(zone, "pointermove", 1, 20);
    pointer(power, "pointerdown", 3);
    expect(input.isHeld("left")).toBe(true);
    expect(input.isHeld("jump")).toBe(true);
    expect(input.consumePress("shoot")).toBe(true);
    expect(input.consumePress("shoot")).toBe(false);
    pointer(power, "pointerup", 3);
    expect(input.isHeld("jump")).toBe(true);
    controls.destroy();
  });

  it("ignores a second joystick finger and releases cancelled or lost touches", () => {
    const { controls, input, zone, power, pointer, windowStub } = setup();
    controls.update(true, true, "water");
    pointer(zone, "pointerdown", 1, 52);
    pointer(zone, "pointermove", 1, 20);
    pointer(zone, "pointerdown", 2, 90);
    pointer(zone, "pointerup", 2);
    expect(input.isHeld("left")).toBe(true);
    pointer(zone, "pointercancel", 1);
    expect(input.isHeld("left")).toBe(false);
    pointer(power, "pointerdown", 3);
    pointer(power, "lostpointercapture", 3);
    expect(input.isHeld("shoot")).toBe(false);
    pointer(zone, "pointerdown", 4, 52);
    pointer(zone, "pointermove", 4, 90);
    windowStub.dispatchEvent(new Event("blur"));
    expect(input.isHeld("right")).toBe(false);
    expect(input.consumePress("shoot")).toBe(false);
    controls.destroy();
  });

  it("enables Power only with an ability and releases movement when battle ends", () => {
    const { controls, input, joystick, zone, power, pointer } = setup();
    controls.update(true, false, null);
    expect(joystick.disabled).toBe(true);
    expect(power.disabled).toBe(true);
    pointer(power, "pointerdown", 1);
    expect(input.consumePress("shoot")).toBe(false);
    controls.update(true, true, "water");
    expect(power.disabled).toBe(false);
    expect(power.textContent).toBe("water ⚡");
    pointer(zone, "pointerdown", 2, 20);
    controls.update(true, false, null);
    expect(input.isHeld("left")).toBe(false);
    expect(power.disabled).toBe(true);
    controls.destroy();
  });
  it("hides movement outside battles and all touch controls in wide desktop layouts", () => {
    const { controls, zone, power, media } = setup();
    controls.update(true, false, "fire");
    expect(zone.hidden).toBe(true);
    controls.update(true, true, "fire");
    expect(zone.hidden).toBe(false);
    media.width = 1440;
    controls.update(true, true, "fire");
    expect(zone.hidden).toBe(true);
    expect(power.disabled).toBe(true);
    controls.destroy();
  });

  it("supports a mouse in tablet view and releases movement when resized to desktop", () => {
    const { controls, input, joystick, zone, pointer, media } = setup(1366);
    controls.update(true, true, null);
    pointer(zone, "pointerdown", 1, 80);
    expect(joystick.hidden).toBe(false);
    expect(input.isHeld("left")).toBe(false);
    pointer(zone, "pointermove", 1, 40);
    expect(input.isHeld("left")).toBe(true);
    media.width = 1367;
    controls.update(true, true, null);
    expect(zone.hidden).toBe(true);
    expect(joystick.hidden).toBe(true);
    expect(input.isHeld("left")).toBe(false);
    media.width = 768;
    controls.update(true, true, null);
    expect(zone.hidden).toBe(false);
    pointer(zone, "pointerdown", 2, 20);
    pointer(zone, "pointermove", 2, 60);
    expect(input.isHeld("right")).toBe(true);
    controls.destroy();
  });

  it("shows a resting joystick in battle and relocates it to each new press", () => {
    const { controls, joystick, zone, pointer } = setup();
    controls.update(true, false, null);
    expect(joystick.hidden).toBe(true);
    controls.update(true, true, null);
    expect(joystick.hidden).toBe(false);
    expect(joystick.style).toMatchObject({ left: "64px", top: "calc(100% - 52px)" });
    pointer(zone, "pointerdown", 1, 180);
    expect(joystick.style).toMatchObject({ left: "180px", top: "40px" });
    pointer(zone, "pointerup", 1);
    expect(joystick.hidden).toBe(false);
    expect(joystick.style).toMatchObject({ left: "64px", top: "calc(100% - 52px)" });
    controls.update(true, false, null);
    expect(joystick.hidden).toBe(true);
    controls.destroy();
  });

});
