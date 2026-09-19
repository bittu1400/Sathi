import { describe, expect, it } from "vitest";
import { getNearestResources } from "./emergency-resources";

describe("getNearestResources", () => {
  it("returns resources sorted by distance", () => {
    const result = getNearestResources(27.687, 86.73, "injury", 2860, 3);
    expect(result).toHaveLength(3);
    expect(result[0]!.distanceKm).toBeLessThanOrEqual(result[1]!.distanceKm);
  });

  it("puts evacuation resources first for altitude illness above 4,000 m", () => {
    const nearest = getNearestResources(27.948, 86.81, "altitude_illness", 4940, 5);
    expect(["helipad", "heli_operator", "hra_post"]).toContain(nearest[0]!.kind);
  });
});
