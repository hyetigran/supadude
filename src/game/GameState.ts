export const MAX_LIVES = 3;

export class GameState {
  private lives: number = MAX_LIVES;
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
   * True at 0 Lives. Mid-Level this pauses for a continue prompt, then
   * triggers a Checkpoint respawn (see GameScene.showOutOfLivesPause) —
   * not a terminal Game Over (CONTEXT.md Attempt).
   */
  hasNoLivesLeft(): boolean {
    return this.lives <= 0;
  }

  /** Score is the running Coins-collected count (see CONTEXT.md Score, ADR-0005) — dying never costs it. */
  getScore(): number {
    return this.coinsCollected;
  }

  getCoinsCollected(): number {
    return this.coinsCollected;
  }

  collectCoin(): void {
    this.coinsCollected += 1;
  }

  resetForNewAttempt(): void {
    this.lives = MAX_LIVES;
    this.coinsCollected = 0;
  }

  /** A Checkpoint respawn (0 Lives mid-Level): restores Lives to full. Score (Coins collected) is unaffected — only resetForNewAttempt (a brand new Attempt) resets it. */
  respawnAtCheckpoint(): void {
    this.lives = MAX_LIVES;
  }
}
