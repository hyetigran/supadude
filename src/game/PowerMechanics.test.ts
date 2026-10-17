import { describe, expect, it } from "vitest";
import { ROAD_DROP, solidTop, solidWorldX, type Level } from "./Level";
import { FLIGHT_CEILING, FLIGHT_DURATION_MS, Runner } from "./Runner";

const EMPTY: Level = { length: 5_000, hazards: [], solids: [], coins: [], totalCoins: 0 };
const PAD: Level = { ...EMPTY, powers: [{ id: "pad", kind: "flightPad", x: 174, altitude: 12 }] };
const ORB: Level = { ...EMPTY, powers: [{ id: "orb", kind: "jumpOrb", x: 90, altitude: 104 }] };

function advance(runner: Runner, ticks: number, held = false) {
  let frame = runner.step(0, { jumpHeld: held });
  for (let i = 0; i < ticks; i++) frame = runner.step(10, { jumpHeld: held });
  return frame;
}

function landOnPad(runner: Runner) {
  runner.step(10, { jumpHeld: true });
  for (let i = 0; i < 100; i++) {
    const frame = runner.step(10, { jumpHeld: false });
    if (frame.events.some(({ type }) => type === "flightStarted")) return frame;
  }
  throw new Error("The jump must land on the flight trampoline");
}

describe("neighborhood powers", () => {
  it("requires a descending landing on the trampoline, not walking through it", () => {
    expect(advance(new Runner(PAD), 90).flightRemainingMs).toBe(0);
    const frame = landOnPad(new Runner(PAD));
    expect(frame.flightRemainingMs).toBeGreaterThan(FLIGHT_DURATION_MS - 20);
    expect(frame.grounded).toBe(false);
    expect(frame.usedPowerIds).toEqual(["pad"]);
  });

  it("lets held input climb and released input descend, then expires in active play time", () => {
    const runner = new Runner(PAD);
    landOnPad(runner);
    const climbed = advance(runner, 70, true);
    const descended = advance(runner, 100, false);
    expect(climbed.altitude).toBeGreaterThan(100);
    expect(descended.altitude).toBeLessThan(climbed.altitude);
    const paused = runner.step(0, { jumpHeld: false });
    expect(paused.flightRemainingMs).toBe(descended.flightRemainingMs);
    let expirations = 0;
    for (let i = 0; i < 300; i++) {
      const frame = runner.step(10, { jumpHeld: true });
      expirations += frame.events.filter(({ type }) => type === "flightEnded").length;
    }
    expect(expirations).toBe(1);
    expect(runner.step(0, { jumpHeld: false }).flightRemainingMs).toBe(0);
  });

  it("caps flight altitude so the player stays inside the playable viewport", () => {
    const runner = new Runner(PAD);
    landOnPad(runner);
    const frame = advance(runner, 250, true);
    expect(frame.altitude).toBe(FLIGHT_CEILING);
    expect(frame.velocityY).toBe(0);
  });

  it("automatically boosts once on airborne orb contact, without another press", () => {
    const runner = new Runner(ORB);
    runner.step(10, { jumpHeld: true });
    let boosts = 0;
    let highest = 0;
    for (let i = 0; i < 150; i++) {
      const frame = runner.step(10, { jumpHeld: false });
      boosts += frame.events.filter(({ type }) => type === "orbActivated").length;
      highest = Math.max(highest, frame.altitude);
    }
    expect(boosts).toBe(1);
    expect(highest).toBeGreaterThan(175);
    expect(runner.step(0, { jumpHeld: false }).usedPowerIds).toEqual(["orb"]);
  });

  it("cannot activate an airborne orb simply by running beneath it", () => {
    expect(advance(new Runner(ORB), 80).usedPowerIds).toEqual([]);
  });

  it("still crashes while flying and resets the timer and power objects on retry", () => {
    const runner = new Runner({ ...PAD, hazards: [{ id: "tree", kind: "tree", x: 430, width: 120, bottom: 0, height: 500 }] });
    landOnPad(runner);
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 300 && frame.attempt === 1; i++) frame = runner.step(10, { jumpHeld: true });
    expect(frame.attempt).toBe(2);
    expect(frame.flightRemainingMs).toBe(0);
    expect(frame.usedPowerIds).toEqual([]);
  });

  it("allows running under branches but punishes jumping into them", () => {
    const level: Level = { ...EMPTY, hazards: [{ id: "branch", kind: "tree", x: 100, width: 110, bottom: 44, height: 92 }] };
    expect(advance(new Runner(level), 60).phase).toBe("running");
    expect(advance(new Runner(level), 30, true).phase).toBe("dead");
  });
});

describe("approaching traffic", () => {
  const car = { id: "car", kind: "car" as const, x: 160, width: 96, height: 48 };

  it("moves toward the player independently of road scrolling", () => {
    expect(solidWorldX(car, 0)).toBeGreaterThan(solidWorldX(car, 100));
    expect(solidWorldX(car, 160)).toBe(160);
    expect(solidWorldX({ ...car, kind: undefined }, 100)).toBe(car.x);
  });

  it("collides at the same moving position used by the renderer", () => {
    const runner = new Runner({ ...EMPTY, solids: [car] });
    let frame = runner.step(0, { jumpHeld: false });
    while (frame.phase === "running") frame = runner.step(10, { jumpHeld: false });
    expect(frame.distance + 14).toBeGreaterThan(solidWorldX(car, frame.distance) - car.width / 2);
    expect(frame.distance).toBeGreaterThan(110);
    expect(frame.events).toContainEqual({ type: "died", obstacleId: "car" });
  });

  it("supports landing on a moving car roof", () => {
    const runner = new Runner({ ...EMPTY, solids: [car] });
    runner.step(10, { jumpHeld: true });
    const frame = advance(runner, 66);
    expect(frame).toMatchObject({ phase: "running", grounded: true, altitude: solidTop(car) });
    expect(solidTop(car)).toBe(car.height - ROAD_DROP);
    expect(solidTop(car)).toBeGreaterThan(0);
  });
});

describe("car elemental powers", () => {
  const fireCar = { id: "red", kind: "car" as const, power: "fire" as const, x: 160, width: 96, height: 48 };
  const blueCar = { ...fireCar, id: "blue", power: "water" as const };
  const bush = { id: "bush", kind: "bush" as const, x: 320, width: 60, bottom: 0, height: 30 };
  const bin = { ...bush, id: "bin", kind: "trashCan" as const, width: 30 };

  function landOnCar(runner: Runner) {
    runner.step(10, { jumpHeld: true });
    for (let i = 0; i < 100; i++) {
      const frame = runner.step(10, { jumpHeld: false });
      if (frame.events.some(({ type }) => type === "carPowerStarted")) return frame;
    }
    throw new Error("Must land on a powered car");
  }

  it.each([
    { car: fireCar, target: bush },
    { car: blueCar, target: bin },
  ])("grants $car.power on a roof landing and clears its target only after shooting", ({ car, target }) => {
    const runner = new Runner({ ...EMPTY, solids: [car], hazards: [target] });
    const frame = landOnCar(runner);
    expect(frame.carPower).toBe(car.power);
    expect(frame.carPowerRemainingMs).toBeGreaterThan(5980);
    expect(frame.usedCarIds).toEqual([car.id]);
    expect(frame.clearedHazardIds).toEqual([]);
    const shot = runner.step(10, { jumpHeld: false, shootPressed: true });
    expect(shot.clearedHazardIds).toEqual([target.id]);
    expect(shot.events).toContainEqual({ type: "hazardCleared", hazardId: target.id, power: car.power });
    expect(advance(runner, 100).phase).toBe("running");
  });

  const hydrant = { ...bush, id: "hydrant", kind: "fireHydrant" as const };
  const yellowCar = { ...fireCar, power: "electricity" as const };

  it.each(["fire", "water", "electricity"] as const)("auto-aims %s at the nearest compatible target", (power) => {
    const near = { ...bush, id: "near", x: 280,
      kind: power === "fire" ? "bush" as const : power === "water" ? "trashCan" as const : "fireHydrant" as const };
    const runner = new Runner({ ...EMPTY, solids: [{ ...fireCar, power }],
      hazards: [{ ...near, id: "far", x: 310 }, near] });
    expect(landOnCar(runner).carPower).toBe(power);
    const shot = runner.step(10, { jumpHeld: false, shootPressed: true });
    expect(shot.clearedHazardIds).toEqual(["near"]);
  });

  it("electricity clears hydrants while cars remain solid", () => {
    const runner = new Runner({ ...EMPTY, solids: [yellowCar, { ...fireCar, id: "target-car", x: 340 }],
      hazards: [{ ...hydrant, x: 280 }] });
    landOnCar(runner);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["hydrant"]);
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 100 && frame.phase === "running"; i++) frame = runner.step(10, { jumpHeld: false, shootPressed: true });
    expect(frame.events).toContainEqual({ type: "died", obstacleId: "target-car" });
  });

  it("fires a tap on the same tick electricity is collected", () => {
    const level = { ...EMPTY, solids: [yellowCar], hazards: [{ ...hydrant, x: 280 }] };
    const probe = new Runner(level);
    const tick = 1000 / 120;
    probe.step(tick, { jumpHeld: true });
    let landingTick = 0;
    while (!probe.step(tick, { jumpHeld: false }).carPower) landingTick++;
    const runner = new Runner(level);
    runner.step(tick, { jumpHeld: true });
    for (let i = 0; i < landingTick; i++) runner.step(tick, { jumpHeld: false });
    expect(runner.step(tick, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["hydrant"]);
  });

  it("queues one rapid second shot at a hydrant without repeating", () => {
    const runner = new Runner({ ...EMPTY, solids: [yellowCar], hazards: [
      { ...hydrant, id: "first", x: 270, width: 20 }, { ...hydrant, id: "second", x: 330, width: 20 },
    ] });
    landOnCar(runner);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["first"]);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["first"]);
    expect(advance(runner, 40).clearedHazardIds).toEqual(["first", "second"]);
    const events = Array.from({ length: 60 }, () => runner.step(10, { jumpHeld: false }).events).flat();
    expect(events.some(({ type }) => type === "shotFired")).toBe(false);
  });

  it("restores cleared hydrants on retry", () => {
    const runner = new Runner({ ...EMPTY, solids: [yellowCar], hazards: [hydrant, { ...bush, x: 500 }] });
    landOnCar(runner);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["hydrant"]);
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 300 && frame.attempt === 1; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.attempt).toBe(2);
    expect(frame.clearedHazardIds).toEqual([]);
  });

  it("does not grant a power for a side collision or passing above the roof", () => {
    const crash = advance(new Runner({ ...EMPTY, solids: [fireCar] }), 55);
    expect(crash.phase).toBe("dead");
    expect(crash.carPower).toBeNull();
    const runner = new Runner({ ...ORB, solids: [fireCar] });
    runner.step(10, { jumpHeld: true });
    expect(advance(runner, 100).usedCarIds).toEqual([]);
  });

  it.each([
    { car: fireCar, hazard: bin },
    { car: blueCar, hazard: bush },
    { car: fireCar, hazard: { ...bush, kind: "tree" as const, height: 500 } },
  ])("keeps nonmatching obstacles dangerous with $car.power", ({ car, hazard }) => {
    const runner = new Runner({ ...EMPTY, solids: [car], hazards: [hazard] });
    landOnCar(runner);
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 100 && frame.phase === "running"; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.phase).toBe("dead");
    expect(frame.clearedHazardIds).toEqual([]);
  });

  it("expires after six active seconds without refreshing while riding the roof", () => {
    const runner = new Runner({ ...EMPTY, solids: [fireCar] });
    const start = landOnCar(runner);
    expect(runner.step(0, { jumpHeld: false }).carPowerRemainingMs).toBe(start.carPowerRemainingMs);
    const later = advance(runner, 20);
    expect(later.carPowerRemainingMs).toBeLessThan(start.carPowerRemainingMs - 190);
    expect(advance(runner, 585).carPower).toBeNull();
    expect(runner.step(0, { jumpHeld: false }).carPowerRemainingMs).toBe(0);
  });

  it("replaces fire with water on the next powered roof", () => {
    const runner = new Runner({ ...EMPTY, solids: [fireCar, { ...blueCar, x: 340 }] });
    expect(landOnCar(runner).carPower).toBe("fire");
    const next = landOnCar(runner);
    expect(next.carPower).toBe("water");
    expect(next.usedCarIds).toEqual(["red", "blue"]);
    expect(next.carPowerRemainingMs).toBeGreaterThan(5980);
  });

  it("restores cars and cleared obstacles on retry", () => {
    const runner = new Runner({ ...EMPTY, solids: [fireCar], hazards: [bush, { ...bin, x: 430 }] });
    landOnCar(runner);
    runner.step(10, { jumpHeld: false, shootPressed: true });
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 300 && frame.attempt === 1; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.attempt).toBe(2);
    expect(frame.carPower).toBeNull();
    expect(frame.carPowerRemainingMs).toBe(0);
    expect(frame.usedCarIds).toEqual([]);
    expect(frame.clearedHazardIds).toEqual([]);
  });

  it("limits shots to nearby targets and enforces a cooldown", () => {
    const runner = new Runner({ ...EMPTY, solids: [fireCar], hazards: [
      bush, { ...bush, id: "second", x: 340 }, { ...bush, id: "far", x: 1000 },
    ] });
    expect(landOnCar(runner).clearedHazardIds).toEqual([]);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["bush"]);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["bush"]);
    expect(advance(runner, 42).clearedHazardIds).toEqual(["bush", "second"]);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).clearedHazardIds).toEqual(["bush", "second"]);
  });
});


describe("manual shooting input", () => {
  const car = { id: "red", kind: "car" as const, power: "fire" as const, x: 160, width: 96, height: 48 };

  it("does nothing without a power", () => {
    const frame = new Runner(EMPTY).step(100, { jumpHeld: false, shootPressed: true });
    expect(frame.events.some(e => e.type === "shotFired")).toBe(false);
  });

  it("buffers a short tap until a fixed tick, shoots even on a miss, and never repeats", () => {
    const runner = new Runner({ ...EMPTY, solids: [car] });
    runner.step(10, { jumpHeld: true });
    advance(runner, 66);
    expect(runner.step(0, { jumpHeld: false }).carPower).toBe("fire");
    expect(runner.step(0, { jumpHeld: false, shootPressed: true }).events).toEqual([]);
    const shot = runner.step(10, { jumpHeld: false });
    expect(shot.events.filter(e => e.type === "shotFired")).toHaveLength(1);
    let shots = 0;
    for (let i = 0; i < 100; i++) shots += runner.step(10, { jumpHeld: false }).events.filter(e => e.type === "shotFired").length;
    expect(shots).toBe(0);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).events.some(e => e.type === "shotFired")).toBe(true);
    advance(runner, 600);
    expect(runner.step(10, { jumpHeld: false, shootPressed: true }).events.some(e => e.type === "shotFired")).toBe(false);
  });

  it("does not clear a matching obstacle without a shot", () => {
    const runner = new Runner({ ...EMPTY, solids: [car], hazards: [{ id: "bush", kind: "bush", x: 320, width: 60, bottom: 0, height: 30 }] });
    runner.step(10, { jumpHeld: true });
    let frame = runner.step(0, { jumpHeld: false });
    for (let i = 0; i < 150 && frame.phase === "running"; i++) frame = runner.step(10, { jumpHeld: false });
    expect(frame.phase).toBe("dead");
    expect(frame.carPower).toBe("fire");
    expect(frame.clearedHazardIds).toEqual([]);
  });
});
