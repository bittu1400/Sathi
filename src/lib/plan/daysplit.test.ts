import { describe, expect, it } from "vitest";
import { nearestPoi, splitByEffort, toDayLegs, walkingHours } from "./daysplit";
import type { Poi } from "./types";

// ~1.1 km per 0.01° of latitude, so these lines have easy round numbers.
function flatLine(points: number, ele = 1000): number[][] {
  return Array.from({ length: points }, (_, i) => [85.3, 27.7 + i * 0.01, ele]);
}

const poi = (name: string, lat: number, lng = 85.3, notable = false): Poi => ({
  id: name,
  name,
  lat,
  lng,
  interest: "culture",
  kind: "temple",
  notable,
});

describe("walkingHours", () => {
  it("is distance over 4.5 km/h plus an hour per 600 m of climb", () => {
    expect(walkingHours(9000, 0)).toBeCloseTo(2, 5);
    expect(walkingHours(0, 600)).toBeCloseTo(1, 5);
    expect(walkingHours(9000, 600)).toBeCloseTo(3, 5);
  });

  it("ignores descent", () => {
    expect(walkingHours(4500, -900)).toBeCloseTo(1, 5);
  });
});

describe("splitByEffort", () => {
  it("returns one leg per day", () => {
    expect(splitByEffort(flatLine(20), 4)).toHaveLength(4);
    expect(splitByEffort(flatLine(20), 1)).toHaveLength(1);
  });

  it("splits a flat line into roughly equal distances", () => {
    const legs = splitByEffort(flatLine(21), 2);
    const [first, second] = legs;
    expect(first && second).toBeTruthy();
    const ratio = (first?.distanceM ?? 0) / (second?.distanceM ?? 1);
    expect(ratio).toBeGreaterThan(0.8);
    expect(ratio).toBeLessThan(1.25);
  });

  it("gives the climbing day less distance than the flat one", () => {
    // First half climbs 1,200 m, second half is level.
    const climbing = Array.from({ length: 11 }, (_, i) => [85.3, 27.7 + i * 0.01, 1000 + i * 120]);
    const flat = Array.from({ length: 10 }, (_, i) => [85.3, 27.81 + i * 0.01, 2200]);
    const legs = splitByEffort([...climbing, ...flat], 2);
    const [first, second] = legs;
    expect(first?.ascentM).toBeGreaterThan(0);
    expect(first?.distanceM ?? 0).toBeLessThan(second?.distanceM ?? 0);
  });

  it("covers the whole line", () => {
    const line = flatLine(30);
    const legs = splitByEffort(line, 3);
    expect(legs[legs.length - 1]?.endIndex).toBe(line.length - 1);
  });

  it("refuses to invent legs it has no line for", () => {
    expect(splitByEffort([[85.3, 27.7]], 3)).toEqual([]);
    expect(splitByEffort(flatLine(5), 0)).toEqual([]);
  });
});

describe("nearestPoi", () => {
  const pois = [poi("Far", 27.9), poi("Near", 27.701)];

  it("picks the closest one inside the radius", () => {
    expect(nearestPoi({ lat: 27.7, lng: 85.3 }, pois, 5)?.name).toBe("Near");
  });

  it("returns null when everything is too far", () => {
    expect(nearestPoi({ lat: 27.7, lng: 85.3 }, [poi("Far", 27.9)], 1)).toBeNull();
  });
});

describe("toDayLegs", () => {
  it("numbers the days and names where each one ends", () => {
    const line = flatLine(21);
    // The line runs 27.70 → 27.90, so the guesthouse sits by its far end.
    const legs = toDayLegs(line, 2, [poi("Boudha", 27.75)], [poi("Guesthouse", 27.898)]);
    expect(legs.map((l) => l.day)).toEqual([1, 2]);
    expect(legs[1]?.endName).toBe("Guesthouse");
    expect(legs[0]?.highlights).toContain("Boudha");
  });

  it("leaves the overnight name null when nothing is near", () => {
    const legs = toDayLegs(flatLine(11), 1, [], [poi("Far away", 29)]);
    expect(legs[0]?.endName).toBeNull();
  });
});

describe("toDayLegs highlights", () => {
  it("lists the places OSM marks notable before the rest", () => {
    const line = flatLine(20);
    const pois = [
      poi("Jorpati Main Road", 27.71),
      poi("A lane", 27.72),
      poi("Another lane", 27.73),
      poi("Scarf of life", 27.74),
      poi("Boudhanath", 27.75, 85.3, true),
    ];
    const [day] = toDayLegs(line, 1, pois, []);
    expect(day?.highlights[0]).toBe("Boudhanath");
    expect(day?.highlights).toHaveLength(4);
  });
});
