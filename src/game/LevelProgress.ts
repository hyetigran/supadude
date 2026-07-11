/**
 * Tracks whether the Checkpoint has been reached as traveled distance
 * increases, and whether the Level has been completed. Kept as a pure,
 * Phaser-free class so GameScene's respawn/results-screen decisions rest on
 * logic that's independently testable.
 *
 * Deliberately one-directional: update() only ever advances
 * currentCheckpointDistance forward (0 -> checkpoint). On a Checkpoint
 * respawn, GameScene rewinds traveled distance back to that Checkpoint, but
 * a once-reached Checkpoint must stay "reached" rather than un-crossing —
 * see CONTEXT.md's Checkpoint definition. There's only ever one Checkpoint
 * (ADR-0004: a single Final Boss, not several), so this only has one
 * threshold to track, not a ratcheting list.
 */
export class LevelProgress {
  private currentCheckpointDistance = 0;

  constructor(
    private readonly checkpoint: number,
    private readonly length: number,
  ) {}

  update(traveled: number): void {
    if (traveled >= this.checkpoint) {
      this.currentCheckpointDistance = this.checkpoint;
    }
  }

  getCheckpointDistance(): number {
    return this.currentCheckpointDistance;
  }

  isComplete(traveled: number): boolean {
    return traveled >= this.length;
  }
}
