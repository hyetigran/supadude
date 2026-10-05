import { RUNNER_TUNING, type RunnerTuning } from "./Runner";

export type Difficulty = "normal" | "hard";
export const HARD_SPEED_MULTIPLIER = 1.23;

/** Only forward speed changes; jump height, flight duration, and retries stay familiar. */
export function tuningForDifficulty(difficulty: Difficulty): RunnerTuning {
  return { ...RUNNER_TUNING, runSpeed: RUNNER_TUNING.runSpeed * (difficulty === "hard" ? HARD_SPEED_MULTIPLIER : 1) };
}
