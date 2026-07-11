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

  it("collectCoin increases the Score by 1 per call (see ADR-0005: Score is Coins collected)", () => {
    const state = new GameState();
    state.collectCoin();
    state.collectCoin();
    expect(state.getScore()).toBe(2);
  });

  it("Score always equals Coins collected", () => {
    const state = new GameState();
    state.collectCoin();
    state.collectCoin();
    state.collectCoin();
    expect(state.getScore()).toBe(state.getCoinsCollected());
  });

  it("resetForNewAttempt restores Lives and Score to their starting values", () => {
    const state = new GameState();
    state.loseLife();
    state.collectCoin();
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

  it("collectCoin does not affect Lives", () => {
    const state = new GameState();
    state.collectCoin();
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

  it("respawnAtCheckpoint does not affect Score or Coins collected — dying doesn't cost Score", () => {
    const state = new GameState();
    state.collectCoin();
    state.respawnAtCheckpoint();
    expect(state.getScore()).toBe(1);
    expect(state.getCoinsCollected()).toBe(1);
  });
});
