import { describe, expect, it } from "vitest";

import {
  estimateAltitude,
  haversineKm,
  nearest,
  nearestWaypoint,
  nextWaypoint,
} from "@/lib/geo";
import type { ResourceKind, RouteDetail, Waypoint } from "@/lib/types";

const waypoints: Waypoint[] = [
  {
    id: "lukla",
    name: "Lukla",
    lat: 27.687,
    lng: 86.7314,
    altM: 2860,
    kind: "trailhead",
    hasTeahouse: true,
    signal: "good",
  },
  {
    id: "phakding",
    name: "Phakding",
    lat: 27.74,
    lng: 86.713,
    altM: 2610,
    kind: "village",
    hasTeahouse: true,
    signal: "good",
  },
  {
    id: "namche",
    name: "Namche Bazaar",
    lat: 27.8057,
    lng: 86.7141,
    altM: 3440,
    kind: "village",
    hasTeahouse: true,
    signal: "good",
  },
];

const route = {
  waypoints,
} satisfies Pick<RouteDetail, "waypoints">;

const resources: Array<{
  id: string;
  kind: ResourceKind;
  lat: number;
  lng: number;
}> = [
  { id: "far-hospital", kind: "hospital", lat: 27.9, lng: 86.9 },
  { id: "near-helipad", kind: "helipad", lat: 27.805, lng: 86.714 },
  { id: "near-hospital", kind: "hospital", lat: 27.806, lng: 86.715 },
];

describe("geo utilities", () => {
  it("calculates the documented Lukla to Namche distance", () => {
    const distanceKm = haversineKm(waypoints[0]!, waypoints[2]!);

    expect(distanceKm).toBeGreaterThanOrEqual(12);
    expect(distanceKm).toBeLessThanOrEqual(14);
  });

  it("returns items in nearest-first order", () => {
    const result = nearest(resources, { lat: 27.805, lng: 86.714 });

    expect(result.map((item) => item.id)).toEqual([
      "near-helipad",
      "near-hospital",
      "far-hospital",
    ]);
  });

  it("filters by resource kind", () => {
    const result = nearest(
      resources,
      { lat: 27.805, lng: 86.714 },
      { kinds: ["hospital"] },
    );

    expect(result.map((item) => item.id)).toEqual([
      "near-hospital",
      "far-hospital",
    ]);
  });

  it("limits the number of nearest results", () => {
    const result = nearest(
      resources,
      { lat: 27.8055, lng: 86.7145 },
      { limit: 2 },
    );

    expect(result).toHaveLength(2);
  });

  it("returns the nearest waypoint and its index", () => {
    const result = nearestWaypoint(route, { lat: 27.741, lng: 86.713 });

    expect(result.waypoint.id).toBe("phakding");
    expect(result.index).toBe(1);
  });

  it("interpolates altitude between the two nearest waypoints", () => {
    const altitude = estimateAltitude(
      route,
      { lat: 27.77285, lng: 86.71355 },
      null,
    );

    expect(altitude).toBeCloseTo((2610 + 3440) / 2, 0);
  });

  it("prefers accurate GPS altitude below 50 metres", () => {
    const altitude = estimateAltitude(
      route,
      { lat: 27.77285, lng: 86.71355 },
      4000,
      49,
    );

    expect(altitude).toBe(4000);
  });

  it("returns the waypoint after the nearest waypoint", () => {
    const waypoint = nextWaypoint(route, { lat: 27.741, lng: 86.713 });

    expect(waypoint?.id).toBe("namche");
  });

  it("returns null when the nearest waypoint is last", () => {
    const waypoint = nextWaypoint(route, { lat: 27.8057, lng: 86.7141 });

    expect(waypoint).toBeNull();
  });
});
