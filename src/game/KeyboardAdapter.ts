import type Phaser from "phaser";
import type { InputManager } from "./InputManager";
import { mapKeyToAction } from "./KeyBindings";

/** Wires native keydown events to the InputManager via KeyBindings. */
export class KeyboardAdapter {
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = mapKeyToAction(event.code);
    if (action) this.input.press(action, event.code);
  };

  private readonly handleKeyUp = (event: KeyboardEvent): void => {
    const action = mapKeyToAction(event.code);
    if (action) this.input.release(action, event.code);
  };

  private readonly handleBlur = (): void => this.input.clearAll();

  constructor(
    private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
    private readonly input: InputManager,
  ) {
    this.keyboard.on("keydown", this.handleKeyDown);
    this.keyboard.on("keyup", this.handleKeyUp);
    if (typeof window !== "undefined") window.addEventListener("blur", this.handleBlur);
  }

  destroy(): void {
    this.keyboard.off("keydown", this.handleKeyDown);
    this.keyboard.off("keyup", this.handleKeyUp);
    if (typeof window !== "undefined") window.removeEventListener("blur", this.handleBlur);
  }
}
