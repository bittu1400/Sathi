import { describe, expect, it } from "vitest";
import { buildTourVariants, orderStops } from "./tour";
import type { InterestId, Poi } from "./types";

const start = { lat: 27.7, lng: 85.3 };

function poi(name: string, interest: InterestId, lat: number, lng = 85.3, notable = false): Poi {
  return { id: name, name, interest, kind: "", lat, lng, notable };
}

describe("orderStops", () => {
  it("walks to the nearest place each time", () => {
    const near = poi("near", "culture", 27.705);
    const middle = poi("middle", "culture", 27.72);
    const far = poi("far", "culture", 27.8);
    expect(orderStops(start, [far, middle, near]).map((s) => s.name)).toEqual(["near", "middle", "far"]);
  });

  it("keeps every stop", () => {
    const stops = [poi("a", "culture", 27.71), poi("b", "forests", 27.72), poi("c", "lakes", 27.73)];
    expect(orderStops(start, stops)).toHaveLength(3);
  });
});

describe("buildTourVariants", () => {
  const pool = [
    poi("Temple 1", "culture", 27.702),
    poi("Temple 2", "culture", 27.704),
    poi("Temple 3", "culture", 27.706),
    poi("Park 1", "forests", 27.703),
    poi("Park 2", "forests", 27.707),
    poi("View 1", "sunrise", 27.709),
    poi("View 2", "sunrise", 27.712),
  ];

  it("returns three distinct day-outs from a mixed pool", () => {
    const variants = buildTourVariants(start, pool, 1, ["culture", "forests", "sunrise"]);
    expect(variants).toHaveLength(3);
    const labels = variants.map((v) => v.label);
    expect(new Set(labels).size).toBe(3);
  });

  it("mixes the interests inside one day rather than stacking one kind", () => {
    const [first] = buildTourVariants(start, pool, 1, ["culture", "forests", "sunrise"]);
    const interests = new Set(first?.stops.map((s) => s.interest));
    expect(interests.size).toBeGreaterThan(1);
  });

  it("gives a longer trip more stops", () => {
    const oneDay = buildTourVariants(start, pool, 1, ["culture", "forests"])[0];
    const threeDays = buildTourVariants(start, pool, 3, ["culture", "forests"])[0];
    expect((threeDays?.stops.length ?? 0)).toBeGreaterThan(oneDay?.stops.length ?? 0);
  });

  it("drops variants that would be the same walk twice", () => {
    const onlyTemples = [poi("T1", "culture", 27.701), poi("T2", "culture", 27.702)];
    const variants = buildTourVariants(start, onlyTemples, 1, ["culture"]);
    const signatures = variants.map((v) =>
      v.stops
        .map((s) => s.id)
        .sort()
        .join("|"),
    );
    expect(new Set(signatures).size).toBe(signatures.length);
  });

  it("visits a place once even when it is tagged twice", () => {
    const twice = [
      poi("Garden of Dreams", "forests", 27.715),
      { ...poi("Garden of Dreams", "villages", 27.7151), id: "way/1" },
      poi("Ratna Park", "forests", 27.706),
    ];
    const [variant] = buildTourVariants(start, twice, 1, ["forests", "villages"]);
    const names = variant?.stops.map((s) => s.name) ?? [];
    expect(new Set(names).size).toBe(names.length);
  });

  it("has nothing to offer when no place was found", () => {
    expect(buildTourVariants(start, [], 2, ["culture"])).toEqual([]);
  });

  it("orders each variant from the start point", () => {
    const [variant] = buildTourVariants(start, pool, 1, ["culture", "forests", "sunrise"]);
    const first = variant?.stops[0];
    expect(first).toBeDefined();
    // Nothing in the pool is closer to the start than the first stop.
    const closest = [...pool].sort((a, b) => Math.abs(a.lat - start.lat) - Math.abs(b.lat - start.lat))[0];
    expect(first?.lat).toBeCloseTo(closest?.lat ?? 0, 3);
  });
});
