import type { RouteSummary, Season, Terrain } from "./types";

export type Fitness = "low" | "medium" | "high";

export interface RecommendPrefs {
  terrain: Terrain[];
  days: number;
  fitness: Fitness;
  maxAltitudeM?: number;
  season: Season;
}

export interface Recommendation {
  route: RouteSummary;
  score: number; // 0–100
  why: string[];
}

const label = (t: string) => t.replace("_", " ");
const metres = (m: number) => `${m.toLocaleString("en-US")} m`;

// Weights from SPEC §7.5: terrain 35, days 25, altitude 20, season 20.
function scoreRoute(route: RouteSummary, prefs: RecommendPrefs): Recommendation {
  const why: string[] = [];

  const overlap = route.terrain.filter((t) => prefs.terrain.includes(t));
  const terrain = prefs.terrain.length ? (35 * overlap.length) / prefs.terrain.length : 0;
  if (overlap.length) why.push(`Matches: ${overlap.map(label).join(", ")}`);

  const [minDays, maxDays] = route.days;
  let days: number;
  if (prefs.days < minDays) {
    days = Math.max(0, 25 - 8 * (minDays - prefs.days));
    why.push(`Needs at least ${minDays} days, you have ${prefs.days}`);
  } else {
    // Spare days are fine (buffer for weather or rest), just a slightly looser fit.
    days = prefs.days <= maxDays ? 25 : 20;
    why.push(`Fits in your ${prefs.days} days (${minDays}–${maxDays} days)`);
  }

  const comfortM = prefs.fitness === "low" ? 4000 : prefs.fitness === "medium" ? 5000 : Infinity;
  let altitude: number;
  if (prefs.maxAltitudeM !== undefined && route.maxAltitudeM > prefs.maxAltitudeM) {
    altitude = 0;
    why.push(`Goes to ${metres(route.maxAltitudeM)}, above your ${metres(prefs.maxAltitudeM)} limit`);
  } else if (route.maxAltitudeM <= comfortM) {
    altitude = 20;
    why.push(`Max altitude ${metres(route.maxAltitudeM)} suits ${prefs.fitness} fitness`);
  } else {
    altitude = prefs.fitness === "low" && route.maxAltitudeM > 5000 ? 0 : 10;
    why.push(`Max altitude ${metres(route.maxAltitudeM)} is demanding for ${prefs.fitness} fitness`);
  }

  const inSeason = route.bestSeasons.includes(prefs.season);
  if (inSeason) why.push(`Good in ${prefs.season}`);
  else why.push(`${prefs.season.charAt(0).toUpperCase()}${prefs.season.slice(1)} is not its best season`);

  return { route, score: Math.round(terrain + days + altitude + (inSeason ? 20 : 0)), why };
}

/** Deterministic ranking, best first; ties keep the input order. */
export function recommend(routes: RouteSummary[], prefs: RecommendPrefs): Recommendation[] {
  return routes.map((r) => scoreRoute(r, prefs)).sort((a, b) => b.score - a.score);
}
