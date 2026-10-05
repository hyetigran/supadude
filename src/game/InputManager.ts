export type Action = "jump" | "shoot" | "pause";

type Listener = () => void;

/**
 * Decouples game logic from raw input sources. Keyboard, touch, and future
 * input adapters all funnel into `trigger`; gameplay code only ever
 * subscribes to logical Actions via `on`.
 */
export class InputManager {
  private listeners = new Map<Action, Set<Listener>>();
  private heldSources = new Map<Action, Set<string>>();
  private pendingPresses = new Set<Action>();

  on(action: Action, listener: Listener): () => void {
    const set = this.listeners.get(action) ?? new Set();
    set.add(listener);
    this.listeners.set(action, set);
    return () => this.off(action, listener);
  }

  off(action: Action, listener: Listener): void {
    this.listeners.get(action)?.delete(listener);
  }

  /** Press listeners fire once per physical press, never from key repeat. */
  press(action: Action, source = "default"): void {
    const sources = this.heldSources.get(action) ?? new Set<string>();
    if (sources.has(source)) return;
    const wasHeld = sources.size > 0;
    sources.add(source);
    this.heldSources.set(action, sources);
    if (wasHeld) return;

    this.pendingPresses.add(action);
    this.listeners.get(action)?.forEach((listener) => listener());
  }

  release(action: Action, source = "default"): void {
    const sources = this.heldSources.get(action);
    sources?.delete(source);
    if (sources?.size === 0) this.heldSources.delete(action);
  }

  isHeld(action: Action): boolean {
    return (this.heldSources.get(action)?.size ?? 0) > 0;
  }

  /** Returns one latched press so taps between render frames are never lost. */
  consumePress(action: Action): boolean {
    const pressed = this.pendingPresses.has(action);
    this.pendingPresses.delete(action);
    return pressed;
  }

  /** Clears every physical source and buffered edge for an action. */
  clear(action: Action): void {
    this.heldSources.delete(action);
    this.pendingPresses.delete(action);
  }

  clearAll(): void {
    this.heldSources.clear();
    this.pendingPresses.clear();
  }

  /** Convenience for discrete actions and tests. */
  trigger(action: Action): void {
    this.press(action, "trigger");
    this.release(action, "trigger");
  }
}
