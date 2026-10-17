import { describe, expect, it } from "vitest";
import { RobberBattle } from "./RobberBattle";
import { Runner, type RunnerFrame } from "./Runner";
import type { Level } from "./Level";
const DT = 1 / 120;

function winBattle(battle: RobberBattle, powered = false) {
  let frame = battle.frame();
  for (let i = 0; i < 120 * 40 && frame.outcome === "fighting"; i++) {
    const target = frame.robbers.find(({ health }) => health > 0)!;
    const dx = target.x - frame.playerX;
    frame = battle.step(DT, { moveX: Math.abs(dx) > 4 ? Math.sign(dx) : 0,
      jumpHeld: frame.jumpReady, shootPressed: powered && i % 50 === 0 }, powered);
  }
  return frame;
}

describe("robber arenas", () => {
  it("spawns 50 distinct robbers inside the arena and caps larger counts", () => {
    const frame = new RobberBattle(50).frame();
    expect(frame.robbers).toHaveLength(50);
    expect(new Set(frame.robbers.map(({ x, y }) => `${x},${y}`)).size).toBe(50);
    for (const robber of frame.robbers) {
      expect(robber.x).toBeGreaterThanOrEqual(32);
      expect(robber.x).toBeLessThanOrEqual(768);
      expect(robber.y).toBe(0);
    }
    expect(new RobberBattle(51).frame().robbers).toHaveLength(50);
  });
  it("keeps movement on the sidewalk with bounded left and right controls", () => {
    const battle = new RobberBattle(1);
    const start = battle.frame();
    const left = battle.step(DT, { moveX: -1, jumpHeld: false }, false);
    expect(left.playerX).toBeLessThan(start.playerX);
    expect(left.playerY).toBe(0);
    const right = battle.step(DT, { moveX: 1, jumpHeld: false }, false);
    expect(right.playerX).toBeCloseTo(start.playerX);
    expect(right.playerY).toBeCloseTo(start.playerY);
    for (let i = 0; i < 200; i++) battle.step(DT, { moveX: -1, jumpHeld: true }, false);
    expect(battle.frame().playerX).toBeGreaterThanOrEqual(32);
    expect(battle.frame().playerY).toBe(0);
  });

  it.each([1, 2])("can defeat %i robbers by jumping without a power-up", (count) => {
    expect(winBattle(new RobberBattle(count)).outcome).toBe("won");
  });

  it("requires a fresh jump press after landing recovery", () => {
    const battle = new RobberBattle(1);
    let frame = battle.step(DT, { jumpHeld: true }, false);
    expect(frame.jumpHeight).toBeGreaterThan(0);
    for (let i = 0; i < 70; i++) frame = battle.step(DT, { jumpHeld: true }, false);
    expect(frame.jumpHeight).toBe(0);
    expect(frame.jumpReady).toBe(false);
    battle.step(DT, { jumpHeld: false }, false);
    expect(battle.step(DT, { jumpHeld: true }, false).jumpHeight).toBe(0);
    for (let i = 0; i < 50; i++) frame = battle.step(DT, { jumpHeld: true }, false);
    expect(frame.jumpReady).toBe(true);
    expect(frame.jumpHeight).toBe(0);
    battle.step(DT, { jumpHeld: false }, false);
    expect(battle.step(DT, { jumpHeld: true }, false).jumpHeight).toBeGreaterThan(0);
  });

  it("chases, warns before punching, and only loses on the third hit", () => {
    const battle = new RobberBattle();
    let frame = battle.frame();
    const healthChanges: number[] = [];
    let warned = false;
    for (let i = 0; i < 120 * 20 && frame.outcome === "fighting"; i++) {
      const previousHealth = frame.health;
      frame = battle.step(DT, { jumpHeld: false }, false);
      warned ||= frame.robbers.some(({ attack }) => attack === "windup");
      if (frame.health !== previousHealth) healthChanges.push(frame.health);
      if (frame.health > 0) expect(frame.outcome).toBe("fighting");
    }
    expect(warned).toBe(true);
    expect(healthChanges).toEqual([2, 1, 0]);
    expect(frame.outcome).toBe("lost");
  });

  it("shoots only with a power-up and honors cooldown", () => {
    const battle = new RobberBattle(1);
    for (let i = 0; i < 80; i++) battle.step(DT, { moveX: 1, jumpHeld: false }, false);
    expect(battle.step(DT, { jumpHeld: false, shootPressed: true }, false).robbers[0].health).toBe(2);
    expect(battle.step(DT, { jumpHeld: false, shootPressed: true }, true).robbers[0].health).toBe(1);
    expect(battle.step(DT, { jumpHeld: false, shootPressed: true }, true).robbers[0].health).toBe(1);
    for (let i = 0; i < 50; i++) battle.step(DT, { jumpHeld: false }, true);
    expect(battle.frame().outcome).toBe("won");
  });
});

const empty: Level = { length: 2000, hazards: [], solids: [], coins: [], totalCoins: 0,
  battles: [{ id: "half", x: 1000, robberCount: 2 }, { id: "late", x: 1800, robberCount: 2 }] };
function tick(runner: Runner, frame: RunnerFrame): RunnerFrame {
  const target = frame.battle?.robbers.find(({ health }) => health > 0);
  const dx = target ? target.x - frame.battle!.playerX : 0;
  return runner.step(1000 * DT, { jumpHeld: !!target && frame.battle!.jumpReady,
    moveX: Math.abs(dx) > 4 ? Math.sign(dx) : 0 });
}

describe("arena integration", () => {
  it.each([0.5, 0.9] as const)("starts QA practice directly at %s and retries that fight", (progress) => {
    const runner = new Runner(empty, undefined, progress);
    let frame = runner.step(0, { jumpHeld: false });
    expect(frame.progress).toBe(progress);
    expect(frame.distance).toBe(empty.length * progress);
    expect(frame.battle?.robbers).toHaveLength(2);
    for (let i = 0; i < 3000 && frame.attempt === 1; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.attempt).toBe(2);
    expect(frame.progress).toBe(progress);
    expect(frame.battle?.health).toBe(3);
  });

  it("resumes after 90% practice without starting the skipped 50% fight", () => {
    const runner = new Runner(empty, undefined, 0.9);
    let frame = runner.step(0, { jumpHeld: false });
    let wins = 0;
    for (let i = 0; i < 120 * 40 && frame.phase !== "complete"; i++) {
      frame = tick(runner, frame);
      wins += frame.events.filter(({ type }) => type === "battleWon").length;
    }
    expect(frame.phase).toBe("complete");
    expect(wins).toBe(1);
  });

  it("runs two fights, freezes course distance, replenishes health and resumes to completion", () => {
    const runner = new Runner(empty);
    let frame = runner.step(0, { jumpHeld: false });
    const entries: number[] = [];
    let wins = 0;
    let damagedFirst = false;
    for (let i = 0; i < 120 * 100 && frame.phase !== "complete"; i++) {
      const previous = frame;
      if (frame.battle && entries.length === 1 && !damagedFirst) {
        frame = runner.step(1000 * DT, { jumpHeld: false });
        damagedFirst = frame.battle!.health < 3;
      } else frame = tick(runner, frame);
      if (frame.events.some(({ type }) => type === "battleStarted")) {
        entries.push(frame.progress);
        expect(frame.battle?.health).toBe(3);
      }
      if (previous.battle && frame.battle) expect(frame.distance).toBe(previous.distance);
      wins += frame.events.filter(({ type }) => type === "battleWon").length;
      expect(frame.phase).not.toBe("dead");
    }
    expect(damagedFirst).toBe(true);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toBeCloseTo(0.5, 2);
    expect(entries[1]).toBeCloseTo(0.9, 2);
    expect(wins).toBe(2);
    expect(frame.phase).toBe("complete");
  });

  it("ignores overlapping course obstacles and cars during a fight, and pause advances nothing", () => {
    const runner = new Runner({ ...empty, battles: [{ id: "start", x: 0, robberCount: 2 }],
      solids: [{ id: "car", kind: "car", x: 0, width: 100, height: 72 }],
      hazards: [{ id: "bush", kind: "bush", x: 0, width: 100, bottom: 0, height: 40 }] });
    let frame = runner.step(10, { jumpHeld: false });
    for (let i = 0; i < 100; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.phase).toBe("running");
    expect(frame.distance).toBe(0);
    expect(runner.step(0, { jumpHeld: false }).battle).toEqual(frame.battle);
  });

  it("preserves an active power and saved jump state throughout combat", () => {
    const runner = new Runner({ ...empty,
      solids: [{ id: "yellow", kind: "car", power: "electricity", x: 160, width: 96, height: 48 }],
      battles: [{ id: "first", x: 240, robberCount: 2 }] });
    runner.step(1000 * DT, { jumpHeld: true });
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 200 && !frame.battle; i++) frame = runner.step(1000 * DT, { jumpHeld: false });
    expect(frame.battle).not.toBeNull();
    expect(frame.carPower).toBe("electricity");
    const saved = frame;
    for (let i = 0; i < 600; i++) frame = runner.step(1000 * DT, { jumpHeld: true, moveX: -1 });
    expect(frame.battle).not.toBeNull();
    expect(frame.carPowerRemainingMs).toBe(saved.carPowerRemainingMs);
    frame = runner.step(1000 * DT, { jumpHeld: false });
    for (let i = 0; i < 120 * 40 && frame.battle; i++) frame = tick(runner, frame);
    expect(frame.events).toContainEqual({ type: "battleWon" });
    expect(frame.altitude).toBe(saved.altitude);
    expect(frame.velocityY).toBe(saved.velocityY);
    expect(frame.distance).toBe(saved.distance);
  });

  it("resets fights and battle health after losing an attempt", () => {
    const runner = new Runner({ ...empty, battles: [{ id: "start", x: 0, robberCount: 2 }] });
    let frame = runner.step(10, { jumpHeld: false });
    for (let i = 0; i < 3000 && frame.attempt === 1; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.attempt).toBe(2);
    frame = runner.step(10, { jumpHeld: false });
    expect(frame.battle?.health).toBe(3);
    expect(frame.battle?.robbers.every(({ health }) => health === 2)).toBe(true);
  });
});
