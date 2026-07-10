export type Lane = "road" | "lawn";

/** The only two Lanes toggle each other — see CONTEXT.md Road Lane / Lawn Lane. */
export function toggleLane(lane: Lane): Lane {
  return lane === "road" ? "lawn" : "road";
}
