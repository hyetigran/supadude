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

  it("hasNoLivesLeft is true once Lives reaches 0", () => {
    const state = new GameState();
    expect(state.hasNoLivesLeft()).toBe(false);
    state.loseLife();
    state.loseLife();
    state.loseLife();
    expect(state.hasNoLivesLeft()).toBe(true);
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

  it("starts with 0 Coins collected", () => {
    const state = new GameState();
    expect(state.getCoinsCollected()).toBe(0);
  });

  it("collectCoin increments the Coins-collected counter", () => {
    const state = new GameState();
    state.collectCoin();
    state.collectCoin();
    expect(state.getCoinsCollected()).toBe(2);
  });

  it("collectCoin does not affect Score or Lives", () => {
    const state = new GameState();
    state.collectCoin();
    expect(state.getScore()).toBe(0);
    expect(state.getLives()).toBe(3);
  });

  it("resetForNewAttempt also resets Coins collected", () => {
    const state = new GameState();
    state.collectCoin();
    state.resetForNewAttempt();
    expect(state.getCoinsCollected()).toBe(0);
  });

  it("respawnAtCheckpoint restores Lives to the cap", () => {
    const state = new GameState();
    state.loseLife();
    state.loseLife();
    state.loseLife();
    state.respawnAtCheckpoint();
    expect(state.getLives()).toBe(3);
  });

  it("respawnAtCheckpoint records a death (increments Score by 1)", () => {
    const state = new GameState();
    state.respawnAtCheckpoint();
    expect(state.getScore()).toBe(1);
  });

  it("respawnAtCheckpoint accumulates Score across multiple respawns, unlike resetForNewAttempt", () => {
    const state = new GameState();
    state.respawnAtCheckpoint();
    state.respawnAtCheckpoint();
    expect(state.getScore()).toBe(2);
  });

  it("respawnAtCheckpoint does not touch Coins collected", () => {
    const state = new GameState();
    state.collectCoin();
    state.respawnAtCheckpoint();
    expect(state.getCoinsCollected()).toBe(1);
  });
});
