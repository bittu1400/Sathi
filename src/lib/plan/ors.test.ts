import { describe, expect, it } from "vitest";
import { inNepal, toPlaces, toPlannedRoutes } from "./ors";

describe("inNepal", () => {
  it("accepts a point inside the country", () => {
    expect(inNepal({ lat: 27.7172, lng: 85.324 })).toBe(true); // Kathmandu
  });

  it("rejects points outside it", () => {
    expect(inNepal({ lat: 28.6139, lng: 77.209 })).toBe(false); // Delhi
    expect(inNepal({ lat: 0, lng: 0 })).toBe(false);
  });
});

describe("toPlannedRoutes", () => {
  const feature = (coordinates: number[][], distance = 1000, duration = 600, ascent = 120) => ({
    geometry: { type: "LineString", coordinates },
    properties: { summary: { distance, duration }, ascent },
  });

  it("maps a feature and labels the first one Fastest", () => {
    const routes = toPlannedRoutes(
      [
        feature([
          [86.7, 27.6, 2800],
          [86.8, 27.7, 3100],
        ]),
      ],
      "hiking",
    );
    expect(routes).toHaveLength(1);
    expect(routes[0]).toMatchObject({
      id: "hiking-0",
      label: "Fastest",
      source: "hiking",
      distanceM: 1000,
      durationS: 600,
      ascentM: 120,
    });
    expect(routes[0]?.geometry.coordinates).toHaveLength(2);
  });

  it("numbers the alternatives", () => {
    const line = [
      [86.7, 27.6],
      [86.8, 27.7],
    ];
    const labels = toPlannedRoutes([feature(line), feature(line), feature(line)], "driving").map((r) => r.label);
    expect(labels).toEqual(["Fastest", "Alternative 1", "Alternative 2"]);
  });

  it("drops features that carry no drawable line", () => {
    const routes = toPlannedRoutes(
      [
        { properties: { summary: { distance: 10, duration: 10 } } },
        feature([[86.7, 27.6]]),
        feature([
          [86.7, 27.6],
          [86.8, 27.7],
        ]),
      ],
      "hiking",
    );
    expect(routes).toHaveLength(1);
  });

  it("leaves ascent null when the engine sends none", () => {
    const routes = toPlannedRoutes(
      [
        {
          geometry: {
            type: "LineString",
            coordinates: [
              [86.7, 27.6],
              [86.8, 27.7],
            ],
          },
          properties: { summary: { distance: 5, duration: 5 } },
        },
      ],
      "hiking",
    );
    expect(routes[0]?.ascentM).toBeNull();
  });
});

describe("toPlaces", () => {
  const feature = (properties: Record<string, unknown>, coordinates: number[]) => ({
    geometry: { coordinates },
    properties,
  });

  it("keeps a named place and describes it by where it is", () => {
    const places = toPlaces([
      feature({ gid: "osm:1", name: "Pokhara", locality: "Pokhara", region: "Gandaki" }, [83.98, 28.2]),
    ]);
    expect(places).toEqual([
      { id: "osm:1", name: "Pokhara", detail: "Gandaki", lat: 28.2, lng: 83.98 },
    ]);
  });

  it("drops a feature with no name or no point", () => {
    expect(
      toPlaces([feature({ name: "  " }, [83.98, 28.2]), feature({ name: "Nowhere" }, [])]),
    ).toEqual([]);
  });

  it("drops the same place sent twice", () => {
    const twice = feature({ name: "Lukla", region: "Khumbu" }, [86.73, 27.69]);
    expect(toPlaces([twice, { ...twice, properties: { name: "Lukla", region: "Khumbu" } }])).toHaveLength(1);
  });
});
