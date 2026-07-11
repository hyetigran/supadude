/** Formats a completion time in milliseconds as M:SS.d for the results screen. */
export function formatCompletionTime(ms: number): string {
  const totalSeconds = ms / 1000;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds - minutes * 60;
  const secondsStr = seconds.toFixed(1).padStart(4, "0");
  return `${minutes}:${secondsStr}`;
}
