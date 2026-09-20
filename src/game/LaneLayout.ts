import type { Lane } from "./Lane";
import {
  DEPTH_SIDEWALK,
  DEPTH_STREET,
  DEPTH_TREE_LAWN,
  NEIGHBORHOOD_TOP_RATIO,
  SIDEWALK_GROUND_INSET,
  SIDEWALK_LANE_HEIGHT,
  SIDEWALK_PERSPECTIVE_SCALE,
  STREET_GROUND_INSET,
  STREET_PERSPECTIVE_SCALE,
  TREE_LAWN_GROUND_INSET,
  TREE_LAWN_LANE_HEIGHT,
  TREE_LAWN_PERSPECTIVE_SCALE,
} from "./VisualScale";

export interface LanePresentation {
  groundY: number;
  depth: number;
  scale: number;
}

export interface NeighborhoodLayout {
  neighborhoodTop: number;
  treeLawnTop: number;
  streetTop: number;
  lanes: Readonly<Record<Lane, LanePresentation>>;
}

/**
 * Converts the viewport height into the complete three-Lane visual contract.
 * Renderers consume this one interface so baselines, depth, and perspective
 * cannot drift independently across fields.
 */
export function createNeighborhoodLayout(viewportHeight: number): NeighborhoodLayout {
  const neighborhoodTop = viewportHeight * NEIGHBORHOOD_TOP_RATIO;
  const treeLawnTop = neighborhoodTop + SIDEWALK_LANE_HEIGHT;
  const streetTop = treeLawnTop + TREE_LAWN_LANE_HEIGHT;

  return {
    neighborhoodTop,
    treeLawnTop,
    streetTop,
    lanes: {
      sidewalk: {
        groundY: treeLawnTop - SIDEWALK_GROUND_INSET,
        depth: DEPTH_SIDEWALK,
        scale: SIDEWALK_PERSPECTIVE_SCALE,
      },
      treeLawn: {
        groundY: streetTop - TREE_LAWN_GROUND_INSET,
        depth: DEPTH_TREE_LAWN,
        scale: TREE_LAWN_PERSPECTIVE_SCALE,
      },
      street: {
        groundY: streetTop + STREET_GROUND_INSET,
        depth: DEPTH_STREET,
        scale: STREET_PERSPECTIVE_SCALE,
      },
    },
  };
}
