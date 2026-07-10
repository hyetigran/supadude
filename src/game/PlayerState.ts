import { toggleLane, type Lane } from "./Lane";

export type VerticalState = "grounded" | "jumping" | "ducking";

/**
 * Supa Dude's vertical pose and Lane, decoupled from Phaser. Jump/duck are
 * only accepted while grounded — mid-air or mid-duck inputs are ignored
 * rather than queued or interrupting the current pose. Lane is a fully
 * independent axis: switching Lanes never affects, and is never blocked by,
 * the vertical pose.
 */
export class PlayerState {
  private state: VerticalState = "grounded";
  private lane: Lane = "road";

  getState(): VerticalState {
    return this.state;
  }

  getLane(): Lane {
    return this.lane;
  }

  switchLane(): void {
    this.lane = toggleLane(this.lane);
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
