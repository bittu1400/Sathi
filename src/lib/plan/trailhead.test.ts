import { describe, expect, it } from "vitest";
import { curatedTrailhead } from "./trailhead";

describe("curatedTrailhead", () => {
  it("starts an Everest trek at the trailhead its own file names", () => {
    expect(curatedTrailhead({ lat: 27.9881, lng: 86.925 })?.name).toBe("Lukla");
  });

  it("has nothing to say about a place no curated trek covers", () => {
    expect(curatedTrailhead({ lat: 27.7172, lng: 85.324 })).toBeNull();
  });
});
