export type Action =
  | "jump"
  | "duck"
  | "laneLeft"
  | "laneRight"
  | "powerActivate"
  | "punch";

type Listener = () => void;

/**
 * Decouples game logic from raw input sources. Keyboard, touch, and future
 * input adapters all funnel into `trigger`; gameplay code only ever
 * subscribes to logical Actions via `on`.
 */
export class InputManager {
  private listeners = new Map<Action, Set<Listener>>();

  on(action: Action, listener: Listener): () => void {
    const set = this.listeners.get(action) ?? new Set();
    set.add(listener);
    this.listeners.set(action, set);
    return () => this.off(action, listener);
  }

  off(action: Action, listener: Listener): void {
    this.listeners.get(action)?.delete(listener);
  }

  trigger(action: Action): void {
    this.listeners.get(action)?.forEach((listener) => listener());
  }
}
