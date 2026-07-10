import { describe, expect, it } from "vitest";
import { GameState } from "./GameState";

describe("GameState", () => {
  it("starts with 3 Lives", () => {
    const state = new GameState();
    expect(state.getLives()).toBe(3);
  });

  it("loseLife decrements Lives by 1", () => {
    const state = new GameState();
    state.loseLife();
    expect(state.getLives()).toBe(2);
  });

  it("loseLife never drops Lives below 0", () => {
    const state = new GameState();
    state.loseLife();
    state.loseLife();
    state.loseLife();
    state.loseLife();
    expect(state.getLives()).toBe(0);
  });

  it("isGameOver is true once Lives reaches 0", () => {
    const state = new GameState();
    expect(state.isGameOver()).toBe(false);
    state.loseLife();
    state.loseLife();
    state.loseLife();
    expect(state.isGameOver()).toBe(true);
  });

  it("gainLife increments Lives", () => {
    const state = new GameState();
    state.loseLife();
    state.gainLife();
    expect(state.getLives()).toBe(3);
  });

  it("gainLife never exceeds the cap of 3", () => {
    const state = new GameState();
    state.gainLife();
    expect(state.getLives()).toBe(3);
  });

  it("starts with a Score of 0", () => {
    const state = new GameState();
    expect(state.getScore()).toBe(0);
  });

  it("recordDeath increases the Score by 1 per call", () => {
    const state = new GameState();
    state.recordDeath();
    state.recordDeath();
    expect(state.getScore()).toBe(2);
  });

  it("resetForNewAttempt restores Lives and Score to their starting values", () => {
    const state = new GameState();
    state.loseLife();
    state.recordDeath();
    state.resetForNewAttempt();
    expect(state.getLives()).toBe(3);
    expect(state.getScore()).toBe(0);
  });
});
