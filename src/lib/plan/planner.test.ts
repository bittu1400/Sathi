import { describe, expect, it } from "vitest";
import { planKind } from "./planner";

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
});
