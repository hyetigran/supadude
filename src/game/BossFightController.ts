import Phaser from "phaser";
import { BossFight, type BossAttackKind } from "./BossFight";
import type { VerticalState } from "./PlayerState";

const DODGE_STREAK_REQUIRED = 3;
const BOSS_HP = 4;
const TELEGRAPH_DURATION_MS = 900;
const VULNERABLE_WINDOW_MS = 1200;
const POST_RESOLVE_PAUSE_MS = 350;

const BOSS_WIDTH = 40;
const BOSS_HEIGHT = 70;

/**
 * Fixed, authored attack pattern (cycled, not random) — same "no
 * procedural generation" spirit as the Level itself (ADR-0003). Boss #1's
 * distinct pattern; Boss #2/#3 (issue #8) will each get their own.
 */
const ATTACK_SEQUENCE: readonly BossAttackKind[] = ["ground", "overhead", "overhead", "ground", "ground"];

export interface BossFightControllerOptions {
  x: number;
  groundY: number;
  getPlayerState: () => VerticalState;
  onHit: () => void;
  onDefeated: () => void;
}

/**
 * Owns the real-time pacing (telegraph → resolve → Vulnerable Window →
 * repeat) and placeholder rendering for one Mini-Boss encounter (see
 * CONTEXT.md Boss Fight) — the pure dodge/streak/HP state machine lives in
 * BossFight. Jump/Duck dodging reuses the existing PlayerState transitions
 * GameScene already drives for Obstacles (read via getPlayerState at
 * resolve time, same as ObstacleField.resolve reads player pose); only
 * Punch is new here, forwarded in via punch().
 */
export class BossFightController {
  private readonly fight = new BossFight(DODGE_STREAK_REQUIRED, BOSS_HP, ATTACK_SEQUENCE);
  private timer?: Phaser.Time.TimerEvent;
  private readonly sprite: Phaser.GameObjects.Rectangle;
  private readonly hpText: Phaser.GameObjects.Text;
  private readonly promptText: Phaser.GameObjects.Text;
  private destroyed = false;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly options: BossFightControllerOptions,
  ) {
    this.sprite = scene.add.rectangle(options.x, options.groundY, BOSS_WIDTH, BOSS_HEIGHT, 0x6b21a8).setOrigin(0.5, 1);
    this.hpText = scene.add
      .text(options.x, options.groundY - BOSS_HEIGHT - 34, "", { fontSize: "14px", color: "#ffffff" })
      .setOrigin(0.5);
    this.promptText = scene.add
      .text(options.x, options.groundY - BOSS_HEIGHT - 14, "", { fontSize: "16px", color: "#ffe066", fontStyle: "bold" })
      .setOrigin(0.5);

    this.render();
    this.scheduleNext();
  }

  /** Forwarded from GameScene's "punch" Action. A no-op outside the Vulnerable Window. */
  punch(): void {
    if (this.destroyed) return;
    if (!this.fight.punch()) return;

    this.timer?.remove();
    this.render();
    if (this.fight.isDefeated()) {
      this.options.onDefeated();
      return;
    }
    this.scheduleNext();
  }

  destroy(): void {
    this.destroyed = true;
    this.timer?.remove();
    this.sprite.destroy();
    this.hpText.destroy();
    this.promptText.destroy();
  }

  private scheduleNext(): void {
    const phase = this.fight.getPhase();
    if (phase.type === "telegraph") {
      this.timer = this.scene.time.delayedCall(TELEGRAPH_DURATION_MS, () => this.resolveTelegraph());
    } else if (phase.type === "vulnerable") {
      this.timer = this.scene.time.delayedCall(VULNERABLE_WINDOW_MS, () => this.expireVulnerable());
    }
  }

  private resolveTelegraph(): void {
    if (this.destroyed) return;

    const hit = this.fight.resolveAttack(this.options.getPlayerState());
    this.render();
    if (hit) this.options.onHit();
    // onHit can synchronously destroy this controller (0 Lives -> Checkpoint
    // respawn abandons the fight, see GameScene.respawnAtCheckpoint) —
    // don't schedule another timer on a controller that's already torn down.
    if (this.destroyed) return;

    if (this.fight.getPhase().type === "vulnerable") {
      this.scheduleNext();
      return;
    }
    this.timer = this.scene.time.delayedCall(POST_RESOLVE_PAUSE_MS, () => this.scheduleNext());
  }

  private expireVulnerable(): void {
    if (this.destroyed) return;

    this.fight.expireVulnerableWindow();
    this.render();
    this.timer = this.scene.time.delayedCall(POST_RESOLVE_PAUSE_MS, () => this.scheduleNext());
  }

  private render(): void {
    const phase = this.fight.getPhase();
    this.hpText.setText(`Boss HP: ${Math.max(this.fight.getHp(), 0)}`);

    if (phase.type === "telegraph") {
      this.sprite.setFillStyle(0x6b21a8);
      this.promptText.setText(phase.attack === "ground" ? "JUMP!" : "DUCK!");
    } else if (phase.type === "vulnerable") {
      this.sprite.setFillStyle(0xffd400);
      this.promptText.setText("PUNCH!");
    } else {
      this.promptText.setText("");
    }
  }
}
