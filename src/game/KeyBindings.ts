import type { Action } from "./InputManager";

/** Jump, optional powered shooting, and pause controls. */
const KEY_BINDINGS: Record<string, Action> = {
  Space: "jump",
  ArrowUp: "up",
  KeyW: "up",
  ArrowDown: "down",
  KeyS: "down",
  ArrowLeft: "left",
  KeyA: "left",
  ArrowRight: "right",
  KeyD: "right",
  KeyF: "shoot",
  KeyX: "shoot",
  Escape: "pause",
  KeyP: "pause",
};

export function mapKeyToAction(key: string): Action | undefined {
  return KEY_BINDINGS[key];
}
