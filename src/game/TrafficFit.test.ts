import { describe, expect, it } from "vitest";
import { TRAFFIC_META, fitTraffic, trafficColor, trafficModel, wheelRotation } from "./TrafficFit";
import { LEVEL } from "./Level";

describe("traffic sprite fit", () => {
  it("uses the car for low traffic and the van for tall traffic, coloured by power", () => {
    expect(trafficModel({ height: 48 })).toBe("car");
    expect(trafficModel({ height: 72 })).toBe("van");
    expect([trafficColor("fire"), trafficColor("water"), trafficColor("electricity"), trafficColor(undefined)])
      .toEqual(["red", "blue", "yellow", "silver"]);
  });

  it("gives every car and van in the level one standard size", () => {
    const sizes = new Set(LEVEL.solids.map(({ width, height }) => `${width}x${height}`));
    expect([...sizes].sort()).toEqual(["128x72", "96x48"]);
  });

  it.each([[96, 48], [128, 72]])("draws the %ix%i box at the art's natural proportions", (width, height) => {
    const model = trafficModel({ height });
    const { anchors } = TRAFFIC_META[model];
    const fit = fitTraffic(model, height);
    // The roof peak is the landing surface and the lowest tire pixel sits on the road.
    expect(fit.top + anchors.roof.peakY * fit.scale).toBeCloseTo(-height);
    expect(fit.top + anchors.groundY * fit.scale).toBeCloseTo(0);
    // The body is centred and its width is within 2px of the box, so no stretch is needed.
    const bodyLeft = fit.left + anchors.bodyLeftX * fit.scale;
    const bodyRight = fit.left + anchors.bodyRightX * fit.scale;
    expect(bodyLeft + bodyRight).toBeCloseTo(0);
    expect(Math.abs(bodyRight - bodyLeft - width)).toBeLessThan(2);
    for (const wheel of fit.wheels) {
      expect(wheel.y + wheel.radius).toBeLessThanOrEqual(0.2);
      expect(Math.abs(wheel.x)).toBeLessThan(width / 2);
    }
  });

  it("rolls the wheels counter-clockwise by the distance the car travels left", () => {
    expect(wheelRotation(100, 100, 10)).toBeCloseTo(0);
    expect(wheelRotation(90, 100, 10)).toBeCloseTo(-1);
  });
});
