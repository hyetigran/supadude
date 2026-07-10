import { describe, expect, it } from "vitest";
import { PlayerState } from "./PlayerState";

describe("PlayerState", () => {
  it("starts grounded", () => {
    const player = new PlayerState();
    expect(player.getState()).toBe("grounded");
  });

  it("jump transitions from grounded to jumping and returns true", () => {
    const player = new PlayerState();
    expect(player.jump()).toBe(true);
    expect(player.getState()).toBe("jumping");
  });

  it("duck transitions from grounded to ducking and returns true", () => {
    const player = new PlayerState();
    expect(player.duck()).toBe(true);
    expect(player.getState()).toBe("ducking");
  });

  it("jump is ignored while already jumping", () => {
    const player = new PlayerState();
    player.jump();
    expect(player.jump()).toBe(false);
    expect(player.getState()).toBe("jumping");
  });

  it("jump is ignored while ducking", () => {
    const player = new PlayerState();
    player.duck();
    expect(player.jump()).toBe(false);
    expect(player.getState()).toBe("ducking");
  });

  it("duck is ignored while already ducking", () => {
    const player = new PlayerState();
    player.duck();
    expect(player.duck()).toBe(false);
    expect(player.getState()).toBe("ducking");
  });

  it("duck is ignored while jumping", () => {
    const player = new PlayerState();
    player.jump();
    expect(player.duck()).toBe(false);
    expect(player.getState()).toBe("jumping");
  });

  it("land returns the player to grounded from jumping", () => {
    const player = new PlayerState();
    player.jump();
    player.land();
    expect(player.getState()).toBe("grounded");
  });

  it("standUp returns the player to grounded from ducking", () => {
    const player = new PlayerState();
    player.duck();
    player.standUp();
    expect(player.getState()).toBe("grounded");
  });

  it("can jump again after landing", () => {
    const player = new PlayerState();
    player.jump();
    player.land();
    expect(player.jump()).toBe(true);
  });

  it("starts in the road Lane", () => {
    const player = new PlayerState();
    expect(player.getLane()).toBe("road");
  });

  it("switchLane toggles between road and lawn", () => {
    const player = new PlayerState();
    player.switchLane();
    expect(player.getLane()).toBe("lawn");
    player.switchLane();
    expect(player.getLane()).toBe("road");
  });

  it("switchLane does not affect the vertical state", () => {
    const player = new PlayerState();
    player.jump();
    player.switchLane();
    expect(player.getState()).toBe("jumping");
  });

  it("jump and duck are unaffected by which Lane the player is in", () => {
    const player = new PlayerState();
    player.switchLane();
    expect(player.jump()).toBe(true);
    player.land();
    expect(player.duck()).toBe(true);
  });

  it("starts with no Power held", () => {
    const player = new PlayerState();
    expect(player.getPower()).toBeNull();
    expect(player.isPowerActivated()).toBe(false);
  });

  it("collectPower holds a Power, not yet activated", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    expect(player.getPower()).toBe("fire");
    expect(player.isPowerActivated()).toBe(false);
  });

  it("collectPower replaces a previously held Power", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    player.collectPower("water");
    expect(player.getPower()).toBe("water");
  });

  it("collecting a new Power resets activation, even if the old one was activated", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    player.activatePower();
    player.collectPower("water");
    expect(player.isPowerActivated()).toBe(false);
  });

  it("activatePower arms a held Power and returns true", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    expect(player.activatePower()).toBe(true);
    expect(player.isPowerActivated()).toBe(true);
  });

  it("activatePower is a no-op returning false when no Power is held", () => {
    const player = new PlayerState();
    expect(player.activatePower()).toBe(false);
    expect(player.isPowerActivated()).toBe(false);
  });

  it("activatePower is a no-op returning false when already activated", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    player.activatePower();
    expect(player.activatePower()).toBe(false);
    expect(player.isPowerActivated()).toBe(true);
  });

  it("clearPower drops the held Power and its activation", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    player.activatePower();
    player.clearPower();
    expect(player.getPower()).toBeNull();
    expect(player.isPowerActivated()).toBe(false);
  });

  it("Power is independent of vertical state and Lane", () => {
    const player = new PlayerState();
    player.collectPower("water");
    player.jump();
    player.switchLane();
    expect(player.getPower()).toBe("water");
  });
});
