import { describe, expect, it } from "vitest";
import { isCleared } from "./ObstacleRules";
import { OBSTACLE_CATALOG, OBSTACLE_IDS } from "./ObstacleCatalog";

describe("OBSTACLE_CATALOG", () => {
  it("assigns each Lane its own Ground and Overhead Obstacle vocabulary", () => {
    expect(OBSTACLE_CATALOG).toMatchObject({
      trashCan: { lane: "sidewalk", kind: "ground", appearance: "trashCan" },
      awning: { lane: "sidewalk", kind: "overhead", appearance: "awning" },
      fireHydrant: { lane: "treeLawn", kind: "ground", appearance: "fireHydrant" },
      lowBranch: { lane: "treeLawn", kind: "overhead", appearance: "lowBranch" },
      utilityBox: { lane: "treeLawn", kind: "ground", appearance: "utilityBox" },
      motorcycle: { lane: "street", kind: "ground", appearance: "motorcycle" },
      redCar: { lane: "street", kind: "ground", appearance: "car" },
      blueCar: { lane: "street", kind: "ground", appearance: "car" },
      greyCar: { lane: "street", kind: "ground", appearance: "car" },
      streetBanner: { lane: "street", kind: "overhead", appearance: "streetBanner" },
    });
  });

  it("makes every Ground Obstacle jumpable and every Overhead Obstacle duckable", () => {
    for (const obstacle of Object.values(OBSTACLE_CATALOG)) {
      expect(isCleared(obstacle.kind, "jumping")).toBe(obstacle.kind === "ground");
      expect(isCleared(obstacle.kind, "ducking")).toBe(obstacle.kind === "overhead");
    }
  });

  it("gives every Lane at least one Ground and one Overhead Obstacle", () => {
    for (const lane of ["sidewalk", "treeLawn", "street"] as const) {
      const laneObstacles = Object.values(OBSTACLE_CATALOG).filter((obstacle) => obstacle.lane === lane);
      expect(laneObstacles.some((obstacle) => obstacle.kind === "ground")).toBe(true);
      expect(laneObstacles.some((obstacle) => obstacle.kind === "overhead")).toBe(true);
    }
  });

  it("keeps destructible materials on the matching Tree Lawn Obstacles", () => {
    expect(OBSTACLE_CATALOG.lowBranch.material).toBe("wood");
    expect(OBSTACLE_CATALOG.utilityBox.material).toBe("electric");

    const obstaclesWithMaterial = OBSTACLE_IDS.filter((id) => "material" in OBSTACLE_CATALOG[id]);
    expect(obstaclesWithMaterial).toEqual(["lowBranch", "utilityBox"]);
  });

  it("keeps all moving traffic oncoming and all neighborhood fixtures stationary", () => {
    const oncoming = OBSTACLE_IDS.filter((id) => OBSTACLE_CATALOG[id].motion === "oncoming");
    expect(oncoming).toEqual(["motorcycle", "redCar", "blueCar", "greyCar"]);

    for (const id of OBSTACLE_IDS.filter((candidate) => !oncoming.includes(candidate))) {
      expect(OBSTACLE_CATALOG[id].motion).toBe("stationary");
    }
  });

  it("grants the specified Power from red and blue Cars only", () => {
    expect(OBSTACLE_CATALOG.redCar).toMatchObject({ appearance: "car", power: "fire" });
    expect(OBSTACLE_CATALOG.blueCar).toMatchObject({ appearance: "car", power: "water" });
    expect(OBSTACLE_CATALOG.greyCar.appearance).toBe("car");
    expect("power" in OBSTACLE_CATALOG.greyCar).toBe(false);

    const powered = OBSTACLE_IDS.filter((id) => "power" in OBSTACLE_CATALOG[id]);
    expect(powered).toEqual(["redCar", "blueCar"]);
  });
});
