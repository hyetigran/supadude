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
});
