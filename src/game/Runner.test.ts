import { tuningForDifficulty, type Difficulty } from "./Difficulty";
import { describe, expect, it } from "vitest";
import { LEVEL, solidWorldX, type Level } from "./Level";
import { Runner, RUNNER_TUNING } from "./Runner";

const EMPTY_LEVEL: Level = { hazards: [], solids: [], coins: [], length: 2_000, totalCoins: 0 };

function advance(runner: Runner, milliseconds: number, jumpHeld = false) {
  let frame = runner.step(0, { jumpHeld });
  for (let elapsed = 0; elapsed < milliseconds; elapsed += 10) {
    frame = runner.step(Math.min(10, milliseconds - elapsed), { jumpHeld });
  }
  return frame;
}

describe("Runner", () => {
  it("auto-runs from a grounded initial state", () => {
    const runner = new Runner(EMPTY_LEVEL);
    const initial = runner.step(0, { jumpHeld: false });
    const moved = advance(runner, 100);

    expect(initial).toMatchObject({ distance: 0, altitude: 0, grounded: true, attempt: 1 });
    expect(moved.distance).toBeCloseTo(26, 4);
  });

  it("jumps once, rotates in air, and lands square", () => {
    const runner = new Runner(EMPTY_LEVEL);
    const takeoff = runner.step(10, { jumpHeld: true });
    const airborne = advance(runner, 300);
    const landed = advance(runner, 700);

    expect(takeoff.events).toContainEqual({ type: "jumped" });
    expect(airborne.altitude).toBeGreaterThan(0);
    expect(airborne.rotation).toBeGreaterThan(0);
    expect(landed).toMatchObject({ altitude: 0, velocityY: 0, grounded: true });
    expect(landed.rotation % 90).toBe(0);
  });

  it("buffers a quick tap until a fixed simulation tick can consume it", () => {
    const runner = new Runner(EMPTY_LEVEL);

    runner.step(1, { jumpHeld: false, jumpPressed: true });
    const frame = runner.step(10, { jumpHeld: false });

    expect(frame.events).toContainEqual({ type: "jumped" });
    expect(frame.grounded).toBe(false);
  });

  it("holding jump automatically jumps again after landing", () => {
    const runner = new Runner(EMPTY_LEVEL);
    let jumpCount = 0;

    for (let elapsed = 0; elapsed < 1_600; elapsed += 10) {
      const frame = runner.step(10, { jumpHeld: true });
      jumpCount += frame.events.filter(({ type }) => type === "jumped").length;
    }

    expect(jumpCount).toBeGreaterThanOrEqual(2);
  });

  it("dies on a spike, freezes briefly, then restarts the full Attempt", () => {
    const level: Level = {
      hazards: [{ id: "spike-1", kind: "spike", x: 70, bottom: 0, width: 30, height: 30 }],
      solids: [],
      coins: [],
      length: 2_000,
      totalCoins: 0,
    };
    const runner = new Runner(level);
    const dead = advance(runner, 300);

    expect(dead.phase).toBe("dead");
    expect(dead.distance).toBeGreaterThan(0);

    let restarted = dead;
    let sawRestart = false;
    for (let elapsed = 0; elapsed < 700 && !sawRestart; elapsed += 10) {
      restarted = runner.step(10, { jumpHeld: false });
      sawRestart = restarted.events.some(({ type }) => type === "restarted");
    }
    expect(sawRestart).toBe(true);
    expect(restarted).toMatchObject({ phase: "running", attempt: 2, altitude: 0 });
    expect(restarted.distance).toBeLessThan(5);
  });

  it("lands on a block when descending from above", () => {
    const level: Level = {
      hazards: [],
      solids: [{ id: "block-1", x: 140, width: 128, height: 48 }],
      coins: [],
      length: 2_000,
      totalCoins: 0,
    };
    const runner = new Runner(level);
    runner.step(10, { jumpHeld: true });
    const frame = advance(runner, 620);

    expect(frame.phase).toBe("running");
    expect(frame.altitude).toBe(48);
    expect(frame.grounded).toBe(true);
  });

  it("dies against a block side when it is not high enough", () => {
    const level: Level = {
      hazards: [],
      solids: [{ id: "block-1", x: 70, width: 64, height: 48 }],
      coins: [],
      length: 2_000,
      totalCoins: 0,
    };

    expect(advance(new Runner(level), 300).phase).toBe("dead");
  });

  it("cannot tunnel upward through a block corner between fixed ticks", () => {
    const level: Level = {
      hazards: [],
      solids: [{ id: "corner-block", x: 67.75, width: 64, height: 48 }],
      coins: [],
      length: 2_000,
      totalCoins: 0,
    };
    const runner = new Runner(level);

    const frame = runner.step(100, { jumpHeld: true });

    expect(frame.phase).toBe("dead");
    expect(frame.events).toContainEqual({ type: "died", obstacleId: "corner-block" });
  });

  it("collects a Coin through the same world-space collision model", () => {
    const level: Level = {
      hazards: [],
      solids: [],
      coins: [{ id: "coin-1", x: 55, altitude: 18 }],
      length: 2_000,
      totalCoins: 1,
    };
    const runner = new Runner(level);
    const frame = advance(runner, 260);

    expect(frame.coinsCollected).toBe(1);
  });

  it("completes a finite Level and then becomes inert", () => {
    const level: Level = { hazards: [], solids: [], coins: [], length: 52, totalCoins: 0 };
    const runner = new Runner(level);
    const complete = advance(runner, 300);
    const after = advance(runner, 300, true);

    expect(complete).toMatchObject({ phase: "complete", distance: 52, progress: 1 });
    expect(after.distance).toBe(52);
  });

  it("is deterministic across equivalent frame-time partitions", () => {
    const first = new Runner(EMPTY_LEVEL);
    const second = new Runner(EMPTY_LEVEL);

    const oneFrame = first.step(100, { jumpHeld: true });
    let manyFrames = second.step(0, { jumpHeld: true });
    for (let i = 0; i < 10; i++) manyFrames = second.step(10, { jumpHeld: true });

    expect(manyFrames).toMatchObject({
      phase: oneFrame.phase,
      distance: oneFrame.distance,
      altitude: oneFrame.altitude,
      velocityY: oneFrame.velocityY,
      rotation: oneFrame.rotation,
    });
  });

  it.each([
    { difficulty: "normal" as Difficulty, frameMs: 10, timingOffset: 0 },
    { difficulty: "normal" as Difficulty, frameMs: 1_000 / 30, timingOffset: 0 },
    { difficulty: "normal" as Difficulty, frameMs: 1_000 / 60, timingOffset: 0 },
    { difficulty: "normal" as Difficulty, frameMs: 1_000 / 144, timingOffset: 0 },
    { difficulty: "normal" as Difficulty, frameMs: 10, timingOffset: -5 },
    { difficulty: "normal" as Difficulty, frameMs: 10, timingOffset: 5 },
    { difficulty: "hard" as Difficulty, frameMs: 1_000 / 30, timingOffset: 0 },
    { difficulty: "hard" as Difficulty, frameMs: 1_000 / 60, timingOffset: 0 },
    { difficulty: "hard" as Difficulty, frameMs: 1_000 / 144, timingOffset: 0 },
  ])("completes $difficulty mode on the authored course at $frameMs ms/frame with $timingOffset px timing offset", ({ difficulty, frameMs, timingOffset }) => {
    const tuning = tuningForDifficulty(difficulty);
    const speedRatio = tuning.runSpeed / RUNNER_TUNING.runSpeed;
    const runner = new Runner(LEVEL, tuning);
    let frame = runner.step(0, { jumpHeld: false });
    let crash = "none";

    const playerHalf = RUNNER_TUNING.playerWidth / 2;
    const activatedPowers = new Set<string>();
    for (let elapsed = 0; elapsed < 180_000 && frame.phase !== "complete"; elapsed += frameMs) {
      // Test-only route: respond to the actual approaching traffic and deliberately use both powers.
      const threats = [
        ...LEVEL.solids.map((solid) => ({
          front: solidWorldX(solid, frame.distance) - solid.width / 2 - playerHalf,
          // At Hard speed, take the second Rooftops pair late in one arc;
          // approach the other long cars early and jump again from their roofs.
          trigger: difficulty === "hard" && solid.width === 160
            ? (solid.id === "solid-20" ? 30 : 112)
            : solid.height === 72 ? 64 : 52,
        })),
        ...LEVEL.hazards.filter((hazard) => hazard.bottom === 0).map((hazard) => ({
          front: hazard.x - hazard.width * 0.41 - playerHalf,
          trigger: (LEVEL.hazards.some((next) => next.bottom === 0 && next.x > hazard.x && next.x - hazard.x < 100) ? 30 : 54) * speedRatio,
        })),
        ...(LEVEL.powers ?? []).filter(({ id }) => !frame.usedPowerIds.includes(id)).map((power) => ({
          front: power.x,
          trigger: (power.kind === "flightPad" ? 164 : 85) * speedRatio,
        })),
      ].sort((a, b) => a.front - b.front);
      const next = threats.find(({ front }) => front >= frame.distance - 1);
      const jumpHeld = frame.flightRemainingMs > 0
        ? difficulty === "hard"
          ? frame.altitude + frame.velocityY * 0.25 < 90
          : (frame.flightRemainingMs > 1400 && frame.altitude < 170)
        : frame.grounded && next !== undefined && next.front - frame.distance <= next.trigger + timingOffset;
      frame = runner.step(frameMs, { jumpHeld });
      for (const id of frame.usedPowerIds) activatedPowers.add(id);
      const death = frame.events.find((event) => event.type === "died");
      if (death?.type === "died") {
        const obstacle = LEVEL.hazards.find(({ id }) => id === death.obstacleId) ?? LEVEL.solids.find(({ id }) => id === death.obstacleId);
        crash = `${death.obstacleId}@${frame.distance}:${JSON.stringify(obstacle)}`;
      }
      if (frame.phase === "dead" || frame.attempt > 1) break;
    }

    expect(frame.phase, crash).toBe("complete");
    expect(activatedPowers.size).toBe(LEVEL.powers?.length);
    expect(frame.attempt).toBe(1);
  });
});
