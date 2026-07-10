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

  isGameOver(): boolean {
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
}
