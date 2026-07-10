import { toggleLane, type Lane } from "./Lane";

export type VerticalState = "grounded" | "jumping" | "ducking";
export type PowerColor = "fire" | "water";

/**
 * Supa Dude's vertical pose, Lane, and held Power, decoupled from Phaser.
 * Jump/duck are only accepted while grounded — mid-air or mid-duck inputs
 * are ignored rather than queued or interrupting the current pose. Lane and
 * Power are fully independent axes: neither is affected by, nor blocks,
 * vertical pose or each other.
 *
 * Power has two stages, per issue #5's acceptance criteria: collecting a
 * Power-up Car holds it (inert — expiry is timed by the caller, e.g.
 * GameScene, and reported via clearPower); activatePower then arms it,
 * which is what actually lets it destroy a matching Blocker Obstacle on
 * contact. Collecting a new Power always replaces whatever was held,
 * discarding it whether or not it had been activated yet.
 */
export class PlayerState {
  private state: VerticalState = "grounded";
  private lane: Lane = "road";
  private power: PowerColor | null = null;
  private powerActivated = false;

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

  getPower(): PowerColor | null {
    return this.power;
  }

  isPowerActivated(): boolean {
    return this.powerActivated;
  }

  collectPower(color: PowerColor): void {
    this.power = color;
    this.powerActivated = false;
  }

  activatePower(): boolean {
    if (!this.power || this.powerActivated) return false;
    this.powerActivated = true;
    return true;
  }

  clearPower(): void {
    this.power = null;
    this.powerActivated = false;
  }
}
