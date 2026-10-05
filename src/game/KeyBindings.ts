import type { Action } from "./InputManager";

/** Jump, optional powered shooting, and pause controls. */
const KEY_BINDINGS: Record<string, Action> = {
  Space: "jump",
  ArrowUp: "jump",
  KeyF: "shoot",
  KeyX: "shoot",
  Escape: "pause",
  KeyP: "pause",
};

export function mapKeyToAction(key: string): Action | undefined {
  return KEY_BINDINGS[key];
}
