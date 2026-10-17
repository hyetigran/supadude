export interface BattleInput {
  moveX?: number;
  jumpHeld: boolean;
  jumpPressed?: boolean;
  shootPressed?: boolean;
}
export interface RobberState {
  id: string;
  x: number;
  y: number;
  health: number;
  attack: "chase" | "windup" | "recover";
  timer: number;
}
export interface BattleFrame {
  playerX: number;
  playerY: number;
  jumpHeight: number;
  jumpReady: boolean;
  health: number;
  invulnerable: boolean;
  robbers: readonly RobberState[];
  outcome: "fighting" | "won" | "lost";
  shot: { x: number; y: number } | null;
}

export const BATTLE_MAX_HEALTH = 3;
export const ROBBER_HEALTH = 2;
export const MAX_ROBBERS = 50;

/** Arena coordinates use the 800px game width and y relative to the course ground. */
export class RobberBattle {
  private x = 180;
  private readonly y = 0;
  private jumpWasHeld = false;
  private landingRecovery = 0;
  private stompAvailable = false;
  private z = 0;
  private velocityZ = 0;
  private health = BATTLE_MAX_HEALTH;
  private invulnerability = 0;
  private shotCooldown = 0;
  private shotQueued = false;
  private shotVisibleSeconds = 0;
  private shot: BattleFrame["shot"] = null;
  private outcome: BattleFrame["outcome"] = "fighting";
  private readonly robbers: RobberState[];

  constructor(count = 2) {
    const total = Math.max(1, Math.min(MAX_ROBBERS, Math.round(count)));
    this.robbers = Array.from({ length: total }, (_, index) => ({
      id: `robber-${index}`,
      x: total <= 2 ? 520 + index * 110 : 400 + index * 340 / (total - 1),
      y: 0,
      health: ROBBER_HEALTH, attack: "chase", timer: 0,
    }));
  }

  step(dt: number, input: BattleInput, powered: boolean): BattleFrame {
    this.shotVisibleSeconds = Math.max(0, this.shotVisibleSeconds - dt);
    if (this.shotVisibleSeconds === 0) this.shot = null;
    if (this.outcome !== "fighting") return this.frame();
    this.invulnerability = Math.max(0, this.invulnerability - dt);
    this.shotCooldown = Math.max(0, this.shotCooldown - dt);
    const jumpPressed = input.jumpPressed || (input.jumpHeld && !this.jumpWasHeld);
    this.jumpWasHeld = input.jumpHeld;
    this.landingRecovery = Math.max(0, this.landingRecovery - dt);
    const mx = Math.max(-1, Math.min(1, input.moveX ?? 0));
    this.x = Math.max(32, Math.min(768, this.x + mx * 235 * dt));
    const previousZ = this.z;
    if (this.z === 0 && this.landingRecovery === 0 && jumpPressed) {
      this.velocityZ = 470;
      this.stompAvailable = true;
    }
    this.z = Math.max(0, this.z + this.velocityZ * dt - 900 * dt * dt);
    this.velocityZ = this.z === 0 ? 0 : this.velocityZ - 1800 * dt;
    if (previousZ > 0 && this.z === 0) this.landingRecovery = 0.35;
    if (powered && input.shootPressed) this.shotQueued = true;
    if (!powered) this.shotQueued = false;
    if (this.shotQueued && this.shotCooldown === 0) {
      this.shotQueued = false;
      this.shotCooldown = 0.4;
      const target = this.robbers.filter(({ health }) => health > 0)
        .map((robber) => ({ robber, distance: Math.hypot(robber.x - this.x, robber.y - this.y) }))
        .filter(({ distance }) => distance <= 260).sort((a, b) => a.distance - b.distance)[0]?.robber;
      if (target) { this.shotVisibleSeconds = 0.12; target.health--; this.shot = { x: target.x, y: target.y - 18 }; }
    }
    for (const robber of this.robbers) {
      if (robber.health <= 0) continue;
      const dx = this.x - robber.x;
      const distance = Math.abs(dx);
      if (this.stompAvailable && this.velocityZ < 0 && previousZ >= 28 && this.z <= 28 && distance < 38) {
        robber.health--;
        this.stompAvailable = false;
        this.z = 29;
        this.velocityZ = 340;
        robber.attack = "recover";
        robber.timer = 0.7;
        robber.x = Math.max(32, Math.min(768, robber.x + (dx <= 0 ? 1 : -1) * 65));
        continue;
      }
      if (robber.attack === "chase") {
        if (distance < 42) { robber.attack = "windup"; robber.timer = 0.45; }
        else {
          robber.x += dx / distance * 85 * dt;
        }
      } else {
        robber.timer -= dt;
        if (robber.timer <= 0) {
          if (robber.attack === "windup") {
            if (distance < 52 && this.z < 30 && this.invulnerability === 0) {
              this.health--;
              this.invulnerability = 1;
            }
            robber.attack = "recover"; robber.timer = 0.9;
          } else robber.attack = "chase";
        }
      }
    }
    if (this.health <= 0) this.outcome = "lost";
    else if (this.robbers.every(({ health }) => health === 0)) this.outcome = "won";
    return this.frame();
  }

  frame(): BattleFrame {
    return { playerX: this.x, playerY: this.y, jumpHeight: this.z, jumpReady: this.z === 0 && this.landingRecovery === 0, health: this.health,
      invulnerable: this.invulnerability > 0, robbers: this.robbers.map((robber) => ({ ...robber })),
      outcome: this.outcome, shot: this.shot && { ...this.shot } };
  }
}
