/**
 * Tracks which Checkpoint is "the most recent" as traveled distance
 * increases, and whether the Level has been completed. Kept as a pure,
 * Phaser-free class so GameScene's respawn/results-screen decisions rest on
 * logic that's independently testable.
 *
 * Deliberately one-directional: update() only ever advances
 * currentCheckpointDistance forward. On a Checkpoint respawn, GameScene
 * rewinds traveled distance back to that Checkpoint, but the most-recently-
 * reached Checkpoint must stay put rather than un-crossing — see
 * CONTEXT.md's Checkpoint definition.
 */
export class LevelProgress {
  private nextCheckpointIndex = 0;
  private currentCheckpointDistance = 0;

  constructor(
    private readonly checkpoints: number[],
    private readonly length: number,
  ) {}

  update(traveled: number): void {
    while (this.nextCheckpointIndex < this.checkpoints.length && traveled >= this.checkpoints[this.nextCheckpointIndex]) {
      this.currentCheckpointDistance = this.checkpoints[this.nextCheckpointIndex];
      this.nextCheckpointIndex++;
    }
  }

  getCheckpointDistance(): number {
    return this.currentCheckpointDistance;
  }

  isComplete(traveled: number): boolean {
    return traveled >= this.length;
  }
}
