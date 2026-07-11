import { isCleared, type ObstacleKind } from "./ObstacleRules";
import type { VerticalState } from "./PlayerState";

/**
 * A telegraphed Mini-Boss attack has the exact same shape as an Obstacle
 * for dodge purposes (see CONTEXT.md Mini-Boss/Boss Fight): a "ground"
 * attack is dodged by jumping, an "overhead" attack by ducking — the same
 * rule ObstacleRules.isCleared already encodes for Obstacles.
 */
export type BossAttackKind = ObstacleKind;

export type BossFightPhase =
  | { type: "telegraph"; attack: BossAttackKind }
  | { type: "vulnerable" }
  | { type: "defeated" };

/**
 * Pure dodge-and-riposte state machine for one Mini-Boss encounter (see
 * CONTEXT.md Boss Fight, Vulnerable Window, Punch): the boss telegraphs an
 * attack, the player dodges with Jump/Duck, and a streak of
 * dodgeStreakRequired consecutive dodges opens a Vulnerable Window in which
 * a Punch deals 1 damage. Real-time pacing (how long a telegraph lasts, how
 * long the Vulnerable Window stays open) is owned by BossFightController —
 * this class only knows state transitions, not timers, and is entirely
 * Phaser-free so the dodge/streak/HP rules are unit-testable on their own.
 *
 * The attack sequence is a fixed, authored array (cycled, not drawn
 * randomly) — consistent with this project's authored-content approach to
 * the Level itself (see ADR-0003).
 */
export class BossFight {
  private hp: number;
  private dodgeStreak = 0;
  private phase: BossFightPhase;
  private nextAttackIndex = 1; // index 0 already seeded the initial telegraph

  constructor(
    private readonly dodgeStreakRequired: number,
    hp: number,
    private readonly attackSequence: readonly BossAttackKind[],
  ) {
    this.hp = hp;
    this.phase = { type: "telegraph", attack: attackSequence[0] };
  }

  getHp(): number {
    return this.hp;
  }

  getPhase(): BossFightPhase {
    return this.phase;
  }

  isDefeated(): boolean {
    return this.phase.type === "defeated";
  }

  /**
   * The currently telegraphed attack resolves: checks whether the player's
   * pose at that instant clears it, same dodge rule as an Obstacle. Returns
   * true if the player was hit. A no-op outside the telegraph phase.
   */
  resolveAttack(playerState: VerticalState): boolean {
    if (this.phase.type !== "telegraph") return false;

    if (isCleared(this.phase.attack, playerState)) {
      this.dodgeStreak += 1;
      this.phase =
        this.dodgeStreak >= this.dodgeStreakRequired ? { type: "vulnerable" } : { type: "telegraph", attack: this.nextAttack() };
      return false;
    }

    this.dodgeStreak = 0;
    this.phase = { type: "telegraph", attack: this.nextAttack() };
    return true;
  }

  /** Punch connects only during the Vulnerable Window. Returns whether it dealt damage. */
  punch(): boolean {
    if (this.phase.type !== "vulnerable") return false;

    this.hp -= 1;
    this.dodgeStreak = 0; // the streak that opened this Window is spent either way
    this.phase = this.hp <= 0 ? { type: "defeated" } : { type: "telegraph", attack: this.nextAttack() };
    return true;
  }

  /** The Vulnerable Window closed without a Punch connecting. A no-op outside the Vulnerable Window. */
  expireVulnerableWindow(): void {
    if (this.phase.type !== "vulnerable") return;
    this.dodgeStreak = 0;
    this.phase = { type: "telegraph", attack: this.nextAttack() };
  }

  private nextAttack(): BossAttackKind {
    const attack = this.attackSequence[this.nextAttackIndex % this.attackSequence.length];
    this.nextAttackIndex += 1;
    return attack;
  }
}
