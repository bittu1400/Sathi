import { describe, expect, it } from "vitest";
import {
  calculateDistanceKm,
  EMERGENCY_RESOURCES,
  getNearestResources,
} from "./emergency-resources";

describe("emergency-resources", () => {
  it("contains verified resources in Nepal", () => {
    expect(EMERGENCY_RESOURCES.length).toBeGreaterThanOrEqual(10);
    for (const r of EMERGENCY_RESOURCES) {
      expect(r.id).toBeDefined();
      expect(r.lat).toBeGreaterThan(26);
      expect(r.lat).toBeLessThan(31);
      expect(r.lng).toBeGreaterThan(80);
      expect(r.lng).toBeLessThan(89);
    }
  });

  it("calculates distance between known points accurately", () => {
    // Lukla (27.687, 86.73) to Pheriche (27.895, 86.819)
    const dist = calculateDistanceKm(27.687, 86.73, 27.895, 86.819);
    // Straight-line distance is ~24 km
    expect(dist).toBeGreaterThan(20);
    expect(dist).toBeLessThan(28);
  });

  it("prioritizes helipads and HRA posts for altitude_illness at >4000m", () => {
    // Near Lobuche (27.948, 86.81) at 4940m
    const nearest = getNearestResources(27.948, 86.81, "altitude_illness", 4940, 5);
    expect(nearest.length).toBe(5);
    // First items should be helipad or HRA post
    const highAltKinds = ["helipad", "heli_operator", "hra_post"];
    expect(highAltKinds).toContain(nearest[0]!.kind);
  });
});
