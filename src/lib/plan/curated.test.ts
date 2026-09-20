import { describe, expect, it } from "vitest";
import { curatedFor, lineLengthM, toCuratedRoute } from "./curated";

describe("lineLengthM", () => {
  it("measures a line, skipping anything that is not a point", () => {
    // Roughly one degree of latitude: ~111 km.
    expect(lineLengthM([[85, 27], [85, 28]])).toBeGreaterThan(110_000);
    expect(lineLengthM([[85, 27]])).toBe(0);
  });
});

describe("curatedFor", () => {
  it("offers the trek whose line reaches the destination", () => {
    const [trek] = curatedFor({ lat: 27.9881, lng: 86.925 });
    expect(trek?.id).toBe("ebc");
  });

  it("offers nothing for a destination no curated line goes near", () => {
    expect(curatedFor({ lat: 27.7172, lng: 85.324 })).toHaveLength(0);
  });
});

describe("toCuratedRoute", () => {
  it("takes its numbers from the file, not from an engine", () => {
    const [trek] = curatedFor({ lat: 27.9881, lng: 86.925 });
    if (!trek) throw new Error("the Everest trek should be there");
    const route = toCuratedRoute(trek);
    expect(route.source).toBe("curated");
    expect(route.trailhead?.name).toBe("Lukla");
    expect(route.distanceM).toBeGreaterThan(0);
    expect(route.ascentM).toBe(trek.stages.reduce((total, stage) => total + stage.ascentM, 0));
  });
});
