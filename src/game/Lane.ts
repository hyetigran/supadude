export const LANES = ["sidewalk", "treeLawn", "street"] as const;

export type Lane = (typeof LANES)[number];
export type LaneMove = "towardSidewalk" | "towardStreet";

export const STARTING_LANE: Lane = "treeLawn";

/** Moves one Lane in the requested direction, stopping at the outer Lanes. */
export function adjacentLane(current: Lane, move: LaneMove): Lane {
  const currentIndex = LANES.indexOf(current);
  const offset = move === "towardSidewalk" ? -1 : 1;
  const nextIndex = Math.max(
    0,
    Math.min(LANES.length - 1, currentIndex + offset),
  );

  return LANES[nextIndex] ?? current;
}
