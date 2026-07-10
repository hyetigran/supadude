import type Phaser from "phaser";
import type { InputManager } from "./InputManager";
import { mapKeyToAction } from "./KeyBindings";

/** Wires native keydown events to the InputManager via KeyBindings. */
export class KeyboardAdapter {
  private readonly handleKeyDown = (event: KeyboardEvent): void => {
    const action = mapKeyToAction(event.code);
    if (action) this.input.trigger(action);
  };

  constructor(
    private readonly keyboard: Phaser.Input.Keyboard.KeyboardPlugin,
    private readonly input: InputManager,
  ) {
    this.keyboard.on("keydown", this.handleKeyDown);
  }

  destroy(): void {
    this.keyboard.off("keydown", this.handleKeyDown);
  }
}
