export type VerticalState = "grounded" | "jumping" | "ducking";

/**
 * Supa Dude's vertical pose, decoupled from Phaser. Jump/duck are only
 * accepted while grounded — mid-air or mid-duck inputs are ignored rather
 * than queued or interrupting the current pose.
 */
export class PlayerState {
  private state: VerticalState = "grounded";

  getState(): VerticalState {
    return this.state;
  }

  jump(): boolean {
    if (this.state !== "grounded") return false;
    this.state = "jumping";
    return true;
  }

  duck(): boolean {
    if (this.state !== "grounded") return false;
    this.state = "ducking";
    return true;
  }

  land(): void {
    this.state = "grounded";
  }

  standUp(): void {
    this.state = "grounded";
  }
}
