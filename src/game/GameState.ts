export const MAX_LIVES = 3;

export class GameState {
  private lives: number = MAX_LIVES;
  private score: number = 0;
  private coinsCollected: number = 0;

  getLives(): number {
    return this.lives;
  }

  loseLife(): void {
    this.lives = Math.max(0, this.lives - 1);
  }

  gainLife(): void {
    this.lives = Math.min(MAX_LIVES, this.lives + 1);
  }

  /**
   * True at 0 Lives. Despite the name's history, this is no longer terminal:
   * mid-Level it triggers a Checkpoint respawn (see respawnAtCheckpoint),
   * not a Game Over — see CONTEXT.md Attempt.
   */
  hasNoLivesLeft(): boolean {
    return this.lives <= 0;
  }

  /** Score is the death count (see CONTEXT.md) — always +1, never an arbitrary amount. */
  getScore(): number {
    return this.score;
  }

  recordDeath(): void {
    this.score += 1;
  }

  /** Coins are a completion stat only (see CONTEXT.md) — never affect Score or Lives. */
  getCoinsCollected(): number {
    return this.coinsCollected;
  }

  collectCoin(): void {
    this.coinsCollected += 1;
  }

  resetForNewAttempt(): void {
    this.lives = MAX_LIVES;
    this.score = 0;
    this.coinsCollected = 0;
  }

  /**
   * A Checkpoint respawn (0 Lives mid-Level): records the death and restores
   * Lives to full, but — unlike resetForNewAttempt — leaves Score and Coins
   * alone. Score is the death count for the whole Level (see CONTEXT.md
   * Attempt/Score), so it must keep accumulating across every respawn within
   * one completion, not reset per-Checkpoint.
   */
  respawnAtCheckpoint(): void {
    this.recordDeath();
    this.lives = MAX_LIVES;
  }
}
