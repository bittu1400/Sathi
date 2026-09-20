"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Check } from "lucide-react";
import type { RouteSummary, Season, Terrain } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { Button } from "../ui/button";
import { Chip, ChipGroup } from "../ui/chip";
import { Panel } from "../ui/panel";
import { Status } from "../ui/status";

export interface RouteFinderProps {
  routes: RouteSummary[];
}

const TERRAINS: Terrain[] = [
  "river_valley",
  "forest",
  "alpine",
  "ridge",
  "glacier",
  "cultural",
];
const SEASONS: Season[] = ["spring", "autumn", "winter", "monsoon"];
const FITNESS = ["low", "medium", "high"] as const;
type Fitness = (typeof FITNESS)[number];
const FIT_LABEL = ["Best fit", "Good fit", "Stretch"] as const;

/** Preferences live in the URL, so a plan can be bookmarked or shared. */
export function RouteFinder({ routes }: RouteFinderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();

  // Slider range comes from the route data, not hard-coded text.
  const shortest = routes.reduce((a, b) => (b.days[0] < a.days[0] ? b : a));
  const longest = routes.reduce((a, b) => (b.days[1] > a.days[1] ? b : a));
  const minDays = shortest.days[0];
  const maxDays = longest.days[1];

  const terrain = (search.get("terrain")?.split(",").filter(Boolean) ?? [
    "forest",
    "ridge",
  ]) as Terrain[];
  const days = Math.min(
    Math.max(Number(search.get("days")) || 5, minDays),
    maxDays,
  );
  const fitness = (FITNESS as readonly string[]).includes(
    search.get("fitness") ?? "",
  )
    ? (search.get("fitness") as Fitness)
    : "low";
  const season = (SEASONS as string[]).includes(search.get("season") ?? "")
    ? (search.get("season") as Season)
    : "spring";

  const update = (
    next: Partial<{
      terrain: Terrain[];
      days: number;
      fitness: Fitness;
      season: Season;
    }>,
  ) => {
    const p = new URLSearchParams({
      terrain: (next.terrain ?? terrain).join(","),
      days: String(next.days ?? days),
      fitness: next.fitness ?? fitness,
      season: next.season ?? season,
    });
    router.replace(`${pathname}?${p.toString()}`, { scroll: false });
  };

  const ranked = routes
    .map((r) => {
      let score = 0;
      const why: string[] = [];
      const match = r.terrain.filter((t) => terrain.includes(t));
      if (match.length > 0) {
        score += match.length * 20;
        why.push(
          `Matches terrain: ${match.map((t) => t.replace("_", " ")).join(", ")}`,
        );
      }
      if (days >= r.days[0] && days <= r.days[1]) {
        score += 30;
        why.push(`Fits your ${days}-day timeframe`);
      } else if (Math.abs(r.days[0] - days) <= 2) {
        score += 15;
      }
      if (fitness === "low" && r.maxAltitudeM <= 3500) {
        score += 25;
        why.push("Comfortable max altitude for lower fitness");
      } else if (fitness === "high" && r.maxAltitudeM > 5000) {
        score += 25;
        why.push("High altitude challenge suitable for high fitness");
      }
      if (r.bestSeasons.includes(season)) {
        score += 20;
        why.push(`Good conditions in ${season}`);
      }
      return { route: r, score, why };
    })
    .sort((a, b) => b.score - a.score);

  // Fit is relative to the best match, so there is never a percentage above 100.
  const top = ranked[0]?.score ?? 0;
  const label = (score: number, i: number) =>
    i === 0 && score > 0
      ? FIT_LABEL[0]
      : score > 0 && score >= top / 2
        ? FIT_LABEL[1]
        : FIT_LABEL[2];

  const toggleTerrain = (t: Terrain) =>
    update({
      terrain: terrain.includes(t)
        ? terrain.filter((x) => x !== t)
        : [...terrain, t],
    });

  const card = ({ route, why }: (typeof ranked)[number], i: number) => (
    <Panel key={route.id} className="space-y-3">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-h2">{route.name}</h3>
            <Status tone={i === 0 ? "ok" : "neutral"}>
              {label(ranked[i]!.score, i)}
            </Status>
            {!route.hasFullData && <Status unverified>Preview</Status>}
          </div>
          <p className="font-mono text-small tabular-nums text-text-muted">
            {route.region} · {route.days[0]}–{route.days[1]} days · max{" "}
            {formatAltitude(route.maxAltitudeM)} · {route.difficulty}
          </p>
        </div>
        <Button asChild variant={i === 0 ? "primary" : "secondary"}>
          <Link href={`/routes/${route.id}`}>
            View route <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Button>
      </div>
      {why.length > 0 && (
        <ul className="space-y-1 text-body">
          {why.map((reason) => (
            <li key={reason} className="flex items-center gap-2">
              <Check className="size-4 shrink-0 text-ok" aria-hidden /> {reason}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <Panel className="space-y-6">
        <fieldset className="space-y-2">
          <legend className="text-body font-medium">Terrain you like</legend>
          <ChipGroup>
            {TERRAINS.map((t) => (
              <Chip
                key={t}
                selected={terrain.includes(t)}
                onClick={() => toggleTerrain(t)}
              >
                {t.replace("_", " ")}
              </Chip>
            ))}
          </ChipGroup>
        </fieldset>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-body font-medium">
            <label htmlFor="plan-days">Days available</label>
            <span className="font-mono tabular-nums text-accent">
              {days} days
            </span>
          </div>
          <input
            id="plan-days"
            type="range"
            min={minDays}
            max={maxDays}
            value={days}
            aria-valuetext={`${days} days`}
            onChange={(e) => update({ days: Number(e.target.value) })}
            className="h-12 w-full cursor-pointer accent-accent"
          />
          <div className="flex justify-between font-mono text-small text-text-muted">
            <span>
              {minDays} days ({shortest.name})
            </span>
            <span>
              {maxDays} days ({longest.name})
            </span>
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-body font-medium">Fitness</legend>
          <ChipGroup>
            {FITNESS.map((f) => (
              <Chip
                key={f}
                selected={fitness === f}
                onClick={() => update({ fitness: f })}
                className="capitalize"
              >
                {f}
              </Chip>
            ))}
          </ChipGroup>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-body font-medium">Season</legend>
          <ChipGroup>
            {SEASONS.map((s) => (
              <Chip
                key={s}
                selected={season === s}
                onClick={() => update({ season: s })}
                className="capitalize"
              >
                {s}
              </Chip>
            ))}
          </ChipGroup>
        </fieldset>
      </Panel>

      <section className="space-y-3" aria-live="polite">
        <h2 className="text-h2">Your top matches</h2>
        {ranked.slice(0, 3).map((r, i) => card(r, i))}
        {ranked.length > 3 && (
          <details className="rounded-[var(--radius-lg)] border border-line bg-surface p-4">
            <summary className="min-h-12 cursor-pointer text-body font-medium">
              Other routes ({ranked.length - 3})
            </summary>
            <div className="mt-3 space-y-3">
              {ranked.slice(3).map((r, i) => card(r, i + 3))}
            </div>
          </details>
        )}
      </section>
    </div>
  );
}
