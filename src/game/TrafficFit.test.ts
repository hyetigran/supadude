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

  it.each(LEVEL.solids.map(({ width, height }) => [width, height]))("fills the %ix%i collision box", (width, height) => {
    const model = trafficModel({ height });
    const { anchors } = TRAFFIC_META[model];
    const fit = fitTraffic(model, width, height);
    // The roof peak is the landing surface and the lowest tire pixel sits on the road.
    expect(fit.top + anchors.roof.peakY * fit.scale).toBeCloseTo(-height);
    expect(fit.top + anchors.groundY * fit.scale).toBeCloseTo(0);
    const first = fit.slices[0];
    const last = fit.slices[fit.slices.length - 1];
    expect(first.x * fit.squash).toBeCloseTo(-width / 2);
    expect((last.x + last.width) * fit.squash).toBeCloseTo(width / 2);
    for (let i = 1; i < fit.slices.length; i++) expect(fit.slices[i].x).toBeCloseTo(fit.slices[i - 1].x + fit.slices[i - 1].width);
    // Wheels rest on the road and stay inside the body.
    for (const wheel of fit.wheels) {
      expect(wheel.y + wheel.radius).toBeLessThanOrEqual(0.2);
      expect(Math.abs(wheel.x * fit.squash)).toBeLessThan(width / 2);
    }
  });

  it("keeps the ends unstretched and wheels circular for every level car at least as long as the art", () => {
    const natural = fitTraffic("car", 96, 48);
    expect(natural.squash).toBe(1);
    const long = fitTraffic("car", 160, 48);
    expect(long.squash).toBe(1);
    expect(long.wheels[1].x - long.wheels[0].x).toBeCloseTo(natural.wheels[1].x - natural.wheels[0].x + 64);
    expect(long.wheels[0].radius).toBeCloseTo(natural.wheels[0].radius);
  });

  it("rolls the wheels counter-clockwise by the distance the car travels left", () => {
    expect(wheelRotation(100, 100, 10)).toBeCloseTo(0);
    expect(wheelRotation(90, 100, 10)).toBeCloseTo(-1);
  });
});
