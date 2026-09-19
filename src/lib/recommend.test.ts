import { describe, expect, it } from "vitest";
import routes from "@/data/routes/index.json";
import type { RouteSummary } from "@/lib/types";
import { recommend } from "@/lib/recommend";

const all = routes as RouteSummary[];

describe("recommend", () => {
  it("ranks Poon Hill first for forest+ridge, 5 days, low fitness, autumn", () => {
    const result = recommend(all, { terrain: ["forest", "ridge"], days: 5, fitness: "low", season: "autumn" });
    expect(result[0]?.route.id).toBe("poon-hill");
  });

  it("puts EBC or Gokyo in the top 2 for alpine+glacier, 14 days, high fitness", () => {
    const top2 = recommend(all, { terrain: ["alpine", "glacier"], days: 14, fitness: "high", season: "spring" })
      .slice(0, 2)
      .map((r) => r.route.id);
    expect(top2.some((id) => id === "ebc" || id === "gokyo")).toBe(true);
  });

  it("gives every result a reason and a 0–100 score", () => {
    for (const r of recommend(all, { terrain: [], days: 3, fitness: "medium", season: "monsoon" })) {
      expect(r.why.length).toBeGreaterThan(0);
      expect(r.score).toBeGreaterThanOrEqual(0);
      expect(r.score).toBeLessThanOrEqual(100);
    }
  });

  it("zeroes altitude comfort above the user's max altitude", () => {
    const prefs = { terrain: ["alpine" as const], days: 14, fitness: "high" as const, season: "spring" as const };
    const free = recommend(all, prefs).find((r) => r.route.id === "ebc")!;
    const capped = recommend(all, { ...prefs, maxAltitudeM: 4000 }).find((r) => r.route.id === "ebc")!;
    expect(free.score - capped.score).toBe(20);
  });

  it("is deterministic", () => {
    const prefs = { terrain: ["forest" as const], days: 8, fitness: "medium" as const, season: "spring" as const };
    expect(recommend(all, prefs)).toEqual(recommend(all, prefs));
  });
});
