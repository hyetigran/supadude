import { describe, expect, it } from "vitest";
import { LevelProgress } from "./LevelProgress";

describe("LevelProgress", () => {
  it("starts with the Level start (0) as the current Checkpoint", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    expect(progress.getCheckpointDistance()).toBe(0);
  });

  it("advances the current Checkpoint once traveled distance reaches it", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    progress.update(1000);
    expect(progress.getCheckpointDistance()).toBe(1000);
  });

  it("does not advance past a Checkpoint that hasn't been reached yet", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    progress.update(999);
    expect(progress.getCheckpointDistance()).toBe(0);
  });

  it("advances through multiple Checkpoints crossed in a single update", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    progress.update(2500);
    expect(progress.getCheckpointDistance()).toBe(2000);
  });

  it("tracks the most recent Checkpoint as distance keeps increasing", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    progress.update(1000);
    progress.update(2000);
    progress.update(2999);
    expect(progress.getCheckpointDistance()).toBe(2000);
  });

  it("stays at the most recent Checkpoint if traveled distance rewinds after a respawn", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    progress.update(2500); // crossed the 2nd Checkpoint
    progress.update(2000); // respawn rewinds traveled distance back to that Checkpoint
    expect(progress.getCheckpointDistance()).toBe(2000);
  });

  it("isComplete is false before the Level's length is reached", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    expect(progress.isComplete(3999)).toBe(false);
  });

  it("isComplete is true once traveled distance reaches the Level's length", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    expect(progress.isComplete(4000)).toBe(true);
    expect(progress.isComplete(5000)).toBe(true);
  });

  it("handles a Level with no Checkpoints crossed yet gracefully", () => {
    const progress = new LevelProgress([1000, 2000, 3000], 4000);
    expect(progress.isComplete(500)).toBe(false);
    expect(progress.getCheckpointDistance()).toBe(0);
  });
});
