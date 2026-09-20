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

  it("starts in the tree lawn Lane", () => {
    const player = new PlayerState();
    expect(player.getLane()).toBe("treeLawn");
  });

  it("moveLane moves one Lane toward the sidewalk and reports the change", () => {
    const player = new PlayerState();
    expect(player.moveLane("towardSidewalk")).toBe(true);
    expect(player.getLane()).toBe("sidewalk");
  });

  it("moveLane moves one Lane toward the street and reports the change", () => {
    const player = new PlayerState();
    expect(player.moveLane("towardStreet")).toBe(true);
    expect(player.getLane()).toBe("street");
  });

  it("moveLane stops at the sidewalk edge and reports no change", () => {
    const player = new PlayerState();
    player.moveLane("towardSidewalk");
    expect(player.moveLane("towardSidewalk")).toBe(false);
    expect(player.getLane()).toBe("sidewalk");
  });

  it("moveLane stops at the street edge and reports no change", () => {
    const player = new PlayerState();
    player.moveLane("towardStreet");
    expect(player.moveLane("towardStreet")).toBe(false);
    expect(player.getLane()).toBe("street");
  });

  it("moveLane never wraps directly between the outer Lanes", () => {
    const player = new PlayerState();
    player.moveLane("towardSidewalk");
    player.moveLane("towardStreet");
    expect(player.getLane()).toBe("treeLawn");
    player.moveLane("towardStreet");
    expect(player.getLane()).toBe("street");
  });

  it("moveLane is allowed while jumping without affecting the vertical state", () => {
    const player = new PlayerState();
    player.jump();
    expect(player.moveLane("towardSidewalk")).toBe(true);
    expect(player.getLane()).toBe("sidewalk");
    expect(player.getState()).toBe("jumping");
  });

  it("moveLane is allowed while ducking without affecting the vertical state", () => {
    const player = new PlayerState();
    player.duck();
    expect(player.moveLane("towardStreet")).toBe(true);
    expect(player.getLane()).toBe("street");
    expect(player.getState()).toBe("ducking");
  });

  it("jump and duck are unaffected by which Lane the player is in", () => {
    const player = new PlayerState();
    player.moveLane("towardSidewalk");
    expect(player.jump()).toBe(true);
    player.land();
    player.moveLane("towardStreet");
    player.moveLane("towardStreet");
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

  it("Lane movement is independent of held Power", () => {
    const player = new PlayerState();
    player.collectPower("water");
    expect(player.moveLane("towardStreet")).toBe(true);
    expect(player.getLane()).toBe("street");
    expect(player.getPower()).toBe("water");
    expect(player.isPowerActivated()).toBe(false);
  });

  it("Lane movement is independent of activated Power", () => {
    const player = new PlayerState();
    player.collectPower("fire");
    player.activatePower();
    expect(player.moveLane("towardSidewalk")).toBe(true);
    expect(player.getLane()).toBe("sidewalk");
    expect(player.getPower()).toBe("fire");
    expect(player.isPowerActivated()).toBe(true);
  });

  it("resetForAttempt restores the middle Lane, grounded pose, and no Power", () => {
    const player = new PlayerState();
    player.moveLane("towardStreet");
    player.jump();
    player.collectPower("fire");
    player.activatePower();

    player.resetForAttempt();

    expect(player.getLane()).toBe("treeLawn");
    expect(player.getState()).toBe("grounded");
    expect(player.getPower()).toBeNull();
    expect(player.isPowerActivated()).toBe(false);
  });
});
