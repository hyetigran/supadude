import type { Action } from "./InputManager";

/** Desktop key-to-Action bindings, per PRD.md §4 (Controls). */
const KEY_BINDINGS: Record<string, Action> = {
  Space: "jump",
  ArrowUp: "jump",
  ArrowDown: "duck",
  ArrowLeft: "laneLeft",
  ArrowRight: "laneRight",
  KeyF: "powerActivate",
  KeyE: "punch",
};

export function mapKeyToAction(key: string): Action | undefined {
  return KEY_BINDINGS[key];
}
