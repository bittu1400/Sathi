import { describe, expect, it } from "vitest";
import { poisNear } from "./overpass";
import { planKind, scorePois, stopsAlong, topInterest } from "./planner";
import type { InterestId, Poi } from "./types";

const kathmandu = { lat: 27.7172, lng: 85.324 };
const pokhara = { lat: 28.2096, lng: 83.9856 };
const everest = { lat: 27.9881, lng: 86.925 };

describe("planKind", () => {
  it("plans a day out when the destination is close", () => {
    expect(planKind(kathmandu, { lat: 27.67, lng: 85.43 })).toBe("tour");
  });

  it("plans a day out in a far city we hold the places of", () => {
    expect(planKind(kathmandu, pokhara)).toBe("tour");
  });

  it("plans a trek to somewhere that is not a city", () => {
    expect(planKind(kathmandu, everest)).toBe("trek");
  });

  it("obeys a trekker who asked for the line between their two points", () => {
    // Both inside the valley: the rule would loop, the trekker said not to.
    expect(planKind(kathmandu, { lat: 27.67, lng: 85.43 }, "direct")).toBe("direct");
    expect(planKind(kathmandu, everest, "direct")).toBe("direct");
  });

  it("obeys a trekker who asked for a day out", () => {
    expect(planKind(kathmandu, everest, "tour")).toBe("tour");
  });
});

const poi = (name: string, interest: InterestId, lat: number, lng: number, notable = false): Poi => ({
  id: name,
  name,
  interest,
  kind: "node",
  notable,
  lat,
  lng,
});

describe("scorePois", () => {
  it("counts only what was asked for, notable places twice", () => {
    const pois = [
      poi("Boudhanath", "culture", 27.72, 85.36, true),
      poi("A shrine", "culture", 27.72, 85.36),
      poi("Some hotel", "teahouses", 27.72, 85.36),
    ];
    expect(scorePois(pois, ["culture"])).toBe(3);
  });

  it("is zero when the line passes nothing they picked", () => {
    expect(scorePois([poi("Some hotel", "teahouses", 27.72, 85.36)], ["mountains"])).toBe(0);
  });
});

describe("topInterest", () => {
  const pois = [
    poi("Peak", "mountains", 27.9, 86.8),
    poi("Another peak", "mountains", 27.9, 86.8),
    poi("Village", "villages", 27.9, 86.8),
  ];

  it("names what the line has most of", () => {
    expect(topInterest(pois, ["mountains", "villages"], new Set())).toBe("mountains");
  });

  it("does not repeat an interest another line already took", () => {
    expect(topInterest(pois, ["mountains", "villages"], new Set<InterestId>(["mountains"]))).toBe("villages");
  });

  it("gives nothing when the line matches nothing left", () => {
    expect(topInterest(pois, ["lakes"], new Set())).toBeNull();
  });
});

describe("poisNear", () => {
  // Two lines out of Kathmandu, a point every kilometre or so: one runs east,
  // the other north.
  const steps = Array.from({ length: 20 }, (_, i) => i * 0.01);
  const east = steps.map((step) => [85.32 + step, 27.71]);
  const north = steps.map((step) => [85.32, 27.71 + step]);

  it("keeps the places the line actually passes", () => {
    const beside = poi("Beside the east line", "villages", 27.712, 85.45);
    expect(poisNear([beside], east, 2_000)).toHaveLength(1);
    expect(poisNear([beside], north, 2_000)).toHaveLength(0);
  });
});

describe("stopsAlong", () => {
  // A line running east out of Kathmandu, a point every kilometre or so.
  const east = Array.from({ length: 20 }, (_, i) => [85.32 + i * 0.01, 27.71]);

  it("pins the places in the order the line reaches them", () => {
    const far = poi("Far", "culture", 27.71, 85.48);
    const near = poi("Near", "culture", 27.71, 85.34);
    expect(stopsAlong([far, near], east).map((p) => p.name)).toEqual(["Near", "Far"]);
  });

  it("keeps the notable ones when there are more than fit", () => {
    const plain = Array.from({ length: 5 }, (_, i) => poi(`Plain ${i}`, "culture", 27.71, 85.33 + i * 0.01));
    const notable = poi("Boudhanath", "culture", 27.71, 85.45, true);
    const stops = stopsAlong([...plain, notable], east, 2);
    expect(stops).toHaveLength(2);
    expect(stops.map((p) => p.name)).toContain("Boudhanath");
  });
});
