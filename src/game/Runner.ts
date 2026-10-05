import { solidWorldX, solidTop, solidBottom, type CarPower, type CoinEvent, type HazardEvent, type Level, type SolidEvent } from "./Level";

export interface RunnerInput {
  /** Current button state. Holding jump repeats on the first tick after landing. */
  jumpHeld: boolean;
  /** Rising edge buffered by the input adapter until at least one fixed tick runs. */
  jumpPressed?: boolean;
  /** One shot per press; holding does not repeat. */
  shootPressed?: boolean;
}

export interface RunnerTuning {
  runSpeed: number;
  gravity: number;
  jumpVelocity: number;
  rotationSpeed: number;
  fixedStepSeconds: number;
  maxFrameMs: number;
  deathDelayMs: number;
  playerWidth: number;
  playerHeight: number;
}

export const RUNNER_TUNING: RunnerTuning = {
  runSpeed: 260,
  gravity: 1_800,
  jumpVelocity: 620,
  rotationSpeed: 540,
  fixedStepSeconds: 1 / 120,
  maxFrameMs: 100,
  deathDelayMs: 620,
  playerWidth: 28,
  playerHeight: 32,
};

export const CAR_POWER_DURATION_MS = 6_000;
export const CAR_POWER_RANGE = 180;
const CAR_ATTACK_INTERVAL_MS = 400;

export const FLIGHT_DURATION_MS = 4_000;
export const FLIGHT_CEILING = 230;

export type RunnerPhase = "running" | "dead" | "complete";

export type RunnerEvent =
  | { type: "shotFired"; power: CarPower; targetX: number; targetY: number }
  | { type: "carPowerStarted"; carId: string; power: CarPower }
  | { type: "hazardCleared"; hazardId: string; power: CarPower }
  | { type: "carPowerEnded" }
  | { type: "flightStarted"; powerId: string }
  | { type: "orbActivated"; powerId: string }
  | { type: "flightEnded" }
  | { type: "jumped" }
  | { type: "landed" }
  | { type: "died"; obstacleId: string }
  | { type: "restarted" }
  | { type: "coinCollected"; coinId: string }
  | { type: "completed" };

export interface RunnerFrame {
  carPower: CarPower | null;
  carPowerRemainingMs: number;
  usedCarIds: readonly string[];
  clearedHazardIds: readonly string[];
  flightRemainingMs: number;
  usedPowerIds: readonly string[];
  phase: RunnerPhase;
  distance: number;
  /** Feet above the implicit ground, in world pixels. */
  altitude: number;
  velocityY: number;
  rotation: number;
  grounded: boolean;
  progress: number;
  attempt: number;
  coinsCollected: number;
  attemptElapsedMs: number;
  events: readonly RunnerEvent[];
}

const COLLISION_EPSILON = 0.01;

/**
 * The authoritative gameplay module. It owns horizontal travel, fixed-step
 * jump physics, platform landing, hazards, Coins, death/retry, and completion.
 * The Phaser Scene is only an input/render/audio adapter over RunnerFrame.
 */
export class Runner {
  private carPower: CarPower | null = null;
  private carPowerRemainingMs = 0;
  private carAttackCooldownMs = 0;
  private readonly usedCarIds = new Set<string>();
  private readonly clearedHazardIds = new Set<string>();
  private flightRemainingMs = 0;
  private readonly usedPowerIds = new Set<string>();
  private phase: RunnerPhase = "running";
  private distance = 0;
  private altitude = 0;
  private velocityY = 0;
  private rotation = 0;
  private grounded = true;
  private attempt = 1;
  private accumulatorMs = 0;
  private deathRemainingMs = 0;
  private jumpPressBuffered = false;
  private shootPressBuffered = false;
  private attemptElapsedMs = 0;
  private readonly collectedCoinIds = new Set<string>();

  constructor(
    private readonly level: Level,
    private readonly tuning: RunnerTuning = RUNNER_TUNING,
  ) {}

  step(deltaMs: number, input: RunnerInput): RunnerFrame {
    const events: RunnerEvent[] = [];
    if (input.shootPressed) this.shootPressBuffered = true;
    if (input.jumpPressed) this.jumpPressBuffered = true;
    this.accumulatorMs += Math.max(0, Math.min(deltaMs, this.tuning.maxFrameMs));
    const fixedStepMs = this.tuning.fixedStepSeconds * 1_000;

    while (this.accumulatorMs >= fixedStepMs - 1e-7) {
      this.accumulatorMs -= fixedStepMs;
      this.fixedStep(input, events);
    }

    return this.frame(events);
  }

  private fixedStep(input: RunnerInput, events: RunnerEvent[]): void {
    const jumpRequested = input.jumpHeld || this.jumpPressBuffered;
    this.jumpPressBuffered = false;
    const shootRequested = this.shootPressBuffered;
    this.shootPressBuffered = false;

    if (this.phase === "complete") return;

    if (this.phase === "dead") {
      this.deathRemainingMs -= this.tuning.fixedStepSeconds * 1_000;
      if (this.deathRemainingMs <= 0) this.restart(events);
      return;
    }

    this.attemptElapsedMs += this.tuning.fixedStepSeconds * 1_000;

    if (this.carPower !== null) {
      this.carPowerRemainingMs = Math.max(0, this.carPowerRemainingMs - this.tuning.fixedStepSeconds * 1_000);
      this.carAttackCooldownMs = Math.max(0, this.carAttackCooldownMs - this.tuning.fixedStepSeconds * 1_000);
      if (this.carPowerRemainingMs === 0) {
        this.carPower = null;
        events.push({ type: "carPowerEnded" });
      }
    }

    const wasFlying = this.flightRemainingMs > 0;
    if (wasFlying) {
      this.flightRemainingMs = Math.max(0, this.flightRemainingMs - this.tuning.fixedStepSeconds * 1_000);
      if (this.flightRemainingMs === 0) events.push({ type: "flightEnded" });
    }

    if (!wasFlying && this.grounded && jumpRequested) {
      this.grounded = false;
      this.velocityY = this.tuning.jumpVelocity;
      events.push({ type: "jumped" });
    }

    const dt = this.tuning.fixedStepSeconds;
    const previousDistance = this.distance;
    const previousAltitude = this.altitude;
    const nextDistance = previousDistance + this.tuning.runSpeed * dt;

    if (wasFlying) {
      this.grounded = false;
      this.velocityY = input.jumpHeld
        ? Math.min(210, this.velocityY + 700 * dt)
        : Math.max(-180, this.velocityY - 520 * dt);
    }

    // Stay attached to a supporting surface until its trailing edge passes.
    if (this.grounded) {
      const blockingSolid = this.level.solids.find(
        (solid) =>
          this.overlapsHorizontally(nextDistance, solidWorldX(solid, nextDistance), solid.width) &&
          solidTop(solid) > this.altitude + COLLISION_EPSILON,
      );
      if (blockingSolid) {
        this.distance = nextDistance;
        this.die(blockingSolid.id, events);
        return;
      }

      const support = this.supportHeightAt(nextDistance, this.altitude);
      if (Math.abs(support - this.altitude) <= COLLISION_EPSILON) {
        this.distance = nextDistance;
        this.altitude = support;
        this.resolveHazardsAndCoins(events, shootRequested);
        this.resolveCompletion(events);
        return;
      }
      this.grounded = false;
    }

    const gravity = wasFlying ? 0 : this.tuning.gravity;
    let nextAltitude = previousAltitude + this.velocityY * dt - 0.5 * gravity * dt * dt;
    let nextVelocity = this.velocityY - gravity * dt;
    if (wasFlying && nextAltitude > FLIGHT_CEILING) {
      nextAltitude = FLIGHT_CEILING;
      nextVelocity = Math.min(0, nextVelocity);
    }
    let landingHeight: number | undefined;
    let landingCar: SolidEvent | undefined;

    for (const solid of this.level.solids) {
      if (!this.overlapsHorizontally(nextDistance, solidWorldX(solid, nextDistance), solid.width)) continue;

      const top = solidTop(solid);
      const enteredThisTick = !this.overlapsHorizontally(previousDistance, solidWorldX(solid, previousDistance), solid.width);
      if (enteredThisTick && previousAltitude < top - COLLISION_EPSILON) {
        this.distance = nextDistance;
        this.altitude = Math.max(0, nextAltitude);
        this.velocityY = nextVelocity;
        this.die(solid.id, events);
        return;
      }

      const crossesTop = nextVelocity <= 0 && previousAltitude >= top - COLLISION_EPSILON && nextAltitude <= top;
      if (crossesTop) {
        if (landingHeight === undefined || top > landingHeight) {
          landingHeight = top;
          landingCar = solid;
        }
        continue;
      }

      if (this.overlapsVertically(nextAltitude, solid)) {
        this.distance = nextDistance;
        this.altitude = Math.max(0, nextAltitude);
        this.velocityY = nextVelocity;
        this.die(solid.id, events);
        return;
      }
    }

    if (landingHeight !== undefined || (nextAltitude <= 0 && nextVelocity <= 0)) {
      nextAltitude = landingHeight ?? 0;
      nextVelocity = 0;
      this.grounded = true;
      this.rotation = Math.round(this.rotation / 90) * 90 % 360;
      events.push({ type: "landed" });
      if (landingCar?.kind === "car" && landingCar.power && !this.usedCarIds.has(landingCar.id)) {
        this.usedCarIds.add(landingCar.id);
        this.carPower = landingCar.power;
        this.carPowerRemainingMs = CAR_POWER_DURATION_MS;
        this.carAttackCooldownMs = 0;
        events.push({ type: "carPowerStarted", carId: landingCar.id, power: landingCar.power });
      }
    } else {
      this.rotation = (this.rotation + this.tuning.rotationSpeed * dt) % 360;
    }

    this.distance = nextDistance;
    this.altitude = nextAltitude;
    this.velocityY = nextVelocity;
    this.resolvePowers(previousAltitude, events);
    this.resolveHazardsAndCoins(events, shootRequested);
    this.resolveCompletion(events);
  }

  private resolvePowers(previousAltitude: number, events: RunnerEvent[]): void {
    for (const power of this.level.powers ?? []) {
      if (this.usedPowerIds.has(power.id)) continue;
      if (!this.overlapsHorizontally(this.distance, power.x, power.kind === "flightPad" ? 56 : 26)) continue;
      if (power.kind === "flightPad") {
        // Only a descending landing on the mat activates it; running through does not.
        if (this.velocityY > 0 || previousAltitude < power.altitude || this.altitude > power.altitude) continue;
        this.usedPowerIds.add(power.id);
        this.flightRemainingMs = FLIGHT_DURATION_MS;
        this.altitude = power.altitude;
        this.velocityY = 210;
        this.grounded = false;
        events.push({ type: "flightStarted", powerId: power.id });
      } else {
        if (this.grounded || this.flightRemainingMs > 0) continue;
        if (this.altitude > power.altitude + 14 || this.altitude + this.tuning.playerHeight < power.altitude - 14) continue;
        this.usedPowerIds.add(power.id);
        this.velocityY = this.tuning.jumpVelocity;
        this.grounded = false;
        events.push({ type: "orbActivated", powerId: power.id });
      }
    }
  }

  private supportHeightAt(distance: number, currentAltitude: number): number {
    let support = 0;
    for (const solid of this.level.solids) {
      if (!this.overlapsHorizontally(distance, solidWorldX(solid, distance), solid.width)) continue;
      if (solidTop(solid) <= currentAltitude + COLLISION_EPSILON) support = Math.max(support, solidTop(solid));
    }
    return support;
  }

  private resolveHazardsAndCoins(events: RunnerEvent[], shootRequested: boolean): void {
    // Powers target only matching ground obstacles ahead; traffic and branches stay dangerous.
    if (shootRequested && this.carPower && this.carAttackCooldownMs === 0) {
      const targetKind = this.carPower === "fire" ? "bush" : "trashCan";
      const target = this.level.hazards
        .filter((hazard) => hazard.kind === targetKind && hazard.bottom === 0 &&
          !this.clearedHazardIds.has(hazard.id) && hazard.x >= this.distance &&
          hazard.x - this.distance <= CAR_POWER_RANGE)
        .sort((a, b) => a.x - b.x)[0];
      this.carAttackCooldownMs = CAR_ATTACK_INTERVAL_MS;
      events.push({ type: "shotFired", power: this.carPower,
        targetX: target?.x ?? this.distance + CAR_POWER_RANGE,
        targetY: target ? target.bottom + target.height / 2 : this.altitude + this.tuning.playerHeight / 2 });
      if (target) {
        this.clearedHazardIds.add(target.id);
        events.push({ type: "hazardCleared", hazardId: target.id, power: this.carPower });
      }
    }
    for (const hazard of this.level.hazards) {
      if (this.clearedHazardIds.has(hazard.id)) continue;
      // Spikes render larger than their collision core so edge clears feel fair.
      if (!this.overlapsHorizontally(this.distance, hazard.x, hazard.width * (hazard.bottom > 0 ? 0.9 : 0.72))) continue;
      if (!this.overlapsHazardVertically(hazard)) continue;
      this.die(hazard.id, events);
      return;
    }

    for (const coin of this.level.coins) {
      if (this.collectedCoinIds.has(coin.id) || !this.overlapsCoin(coin)) continue;
      this.collectedCoinIds.add(coin.id);
      events.push({ type: "coinCollected", coinId: coin.id });
    }
  }

  private resolveCompletion(events: RunnerEvent[]): void {
    if (this.phase !== "running" || this.distance < this.level.length) return;
    this.distance = this.level.length;
    this.phase = "complete";
    events.push({ type: "completed" });
  }

  private overlapsHorizontally(playerX: number, objectX: number, objectWidth: number): boolean {
    const playerHalf = this.tuning.playerWidth / 2;
    const objectHalf = objectWidth / 2;
    return playerX + playerHalf > objectX - objectHalf && playerX - playerHalf < objectX + objectHalf;
  }

  private overlapsVertically(playerBottom: number, solid: SolidEvent): boolean {
    const playerTop = playerBottom + this.tuning.playerHeight;
    return playerTop > solidBottom(solid) && playerBottom < solidTop(solid) - COLLISION_EPSILON;
  }

  private overlapsHazardVertically(hazard: HazardEvent): boolean {
    const playerTop = this.altitude + this.tuning.playerHeight;
    const hazardTop = hazard.bottom + hazard.height * (hazard.bottom > 0 ? 1 : 0.72);
    return playerTop > hazard.bottom + 2 && this.altitude < hazardTop;
  }

  private overlapsCoin(coin: CoinEvent): boolean {
    const coinRadius = 10;
    const horizontal = Math.abs(this.distance - coin.x) < this.tuning.playerWidth / 2 + coinRadius;
    const vertical =
      this.altitude + this.tuning.playerHeight > coin.altitude - coinRadius &&
      this.altitude < coin.altitude + coinRadius;
    return horizontal && vertical;
  }

  private die(obstacleId: string, events: RunnerEvent[]): void {
    if (this.phase !== "running") return;
    this.phase = "dead";
    this.deathRemainingMs = this.tuning.deathDelayMs;
    events.push({ type: "died", obstacleId });
  }

  private restart(events: RunnerEvent[]): void {
    this.phase = "running";
    this.distance = 0;
    this.altitude = 0;
    this.velocityY = 0;
    this.rotation = 0;
    this.grounded = true;
    this.attempt += 1;
    this.deathRemainingMs = 0;
    this.jumpPressBuffered = false;
    this.shootPressBuffered = false;
    this.attemptElapsedMs = 0;
    this.collectedCoinIds.clear();
    this.usedPowerIds.clear();
    this.flightRemainingMs = 0;
    this.carPower = null;
    this.carPowerRemainingMs = 0;
    this.carAttackCooldownMs = 0;
    this.usedCarIds.clear();
    this.clearedHazardIds.clear();
    events.push({ type: "restarted" });
  }

  private frame(events: readonly RunnerEvent[]): RunnerFrame {
    return {
      carPower: this.carPower,
      carPowerRemainingMs: this.carPowerRemainingMs,
      usedCarIds: [...this.usedCarIds],
      clearedHazardIds: [...this.clearedHazardIds],
      flightRemainingMs: this.flightRemainingMs,
      usedPowerIds: [...this.usedPowerIds],
      phase: this.phase,
      distance: this.distance,
      altitude: this.altitude,
      velocityY: this.velocityY,
      rotation: this.rotation,
      grounded: this.grounded,
      progress: Math.min(1, this.distance / this.level.length),
      attempt: this.attempt,
      coinsCollected: this.collectedCoinIds.size,
      attemptElapsedMs: this.attemptElapsedMs,
      events,
    };
  }
}
