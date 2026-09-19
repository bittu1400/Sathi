"use client";

import * as React from "react";
import Link from "next/link";
import { Terrain, Season, RouteSummary } from "@/lib/types";
import type { RouteLine } from "@/lib/data";
import { recommend, type Fitness } from "@/lib/recommend";
import { RouteChoiceMap } from "../map/Map";
import { Chip, ChipGroup } from "../ui/chip";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Compass, Sparkles, ArrowRight, Check, MapPin } from "lucide-react";

export interface RouteFinderProps {
  routes: RouteSummary[];
  lines: Record<string, RouteLine>;
}

export function RouteFinder({ routes, lines }: RouteFinderProps) {
  const [selectedTerrain, setSelectedTerrain] = React.useState<Terrain[]>([
    "forest",
    "ridge",
  ]);
  const [days, setDays] = React.useState<number>(5);
  const [fitness, setFitness] = React.useState<Fitness>("low");
  const [season, setSeason] = React.useState<Season>("spring");

  const topRoutes = React.useMemo(
    () => recommend(routes, { terrain: selectedTerrain, days, fitness, season }).slice(0, 3),
    [routes, selectedTerrain, days, fitness, season],
  );
  const [chosenId, setChosenId] = React.useState<string | null>(null);
  // Changing preferences can push the chosen route out of the top 3: fall back to #1.
  const selectedId = topRoutes.some((r) => r.route.id === chosenId) ? chosenId! : (topRoutes[0]?.route.id ?? "");
  const choices = React.useMemo(
    () =>
      topRoutes.flatMap(({ route }, idx) => {
        const line = lines[route.id];
        return line ? [{ id: route.id, name: route.name, rank: idx + 1, line }] : [];
      }),
    [topRoutes, lines],
  );

  const toggleTerrain = (t: Terrain) => {
    if (selectedTerrain.includes(t)) {
      setSelectedTerrain(selectedTerrain.filter((x) => x !== t));
    } else {
      setSelectedTerrain([...selectedTerrain, t]);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-surface border border-border rounded-[var(--radius-lg)] p-6 space-y-6 shadow-md">
        <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-accent font-semibold">
          <Sparkles className="w-4 h-4 text-accent" />
          Interactive Route Finder
        </div>

        {/* 1. Terrain selection */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text block">
            1. What type of terrain do you prefer?
          </label>
          <ChipGroup>
            {(["river_valley", "forest", "alpine", "ridge", "glacier", "cultural"] as Terrain[]).map(
              (t) => (
                <Chip
                  key={t}
                  selected={selectedTerrain.includes(t)}
                  onClick={() => toggleTerrain(t)}
                >
                  {t.replace("_", " ")}
                </Chip>
              )
            )}
          </ChipGroup>
        </div>

        {/* 2. Days available */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm font-semibold text-text">
            <span>2. How many days do you have available?</span>
            <span className="font-mono text-accent">{days} Days</span>
          </div>
          <input
            type="range"
            min={3}
            max={18}
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full accent-accent cursor-pointer"
          />
          <div className="flex justify-between text-xs text-text-muted font-mono">
            <span>3 days (Poon Hill)</span>
            <span>18 days (Annapurna Circuit)</span>
          </div>
        </div>

        {/* 3. Fitness level */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text block">
            3. What is your current fitness level?
          </label>
          <div className="grid grid-cols-3 gap-3">
            {(["low", "medium", "high"] as const).map((f) => (
              <Button
                key={f}
                type="button"
                variant={fitness === f ? "primary" : "secondary"}
                onClick={() => setFitness(f)}
                className="capitalize"
              >
                {f}
              </Button>
            ))}
          </div>
        </div>

        {/* 4. Season */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-text block">
            4. Trekking Season
          </label>
          <ChipGroup>
            {(["spring", "autumn", "winter", "monsoon"] as Season[]).map((s) => (
              <Chip
                key={s}
                selected={season === s}
                onClick={() => setSeason(s)}
              >
                {s}
              </Chip>
            ))}
          </ChipGroup>
        </div>
      </div>

      {/* Top 3 recommendations */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Compass className="w-5 h-5 text-accent" />
          Your top {topRoutes.length} routes
        </h2>

        {choices.length > 0 && (
          <div className="space-y-2">
            <RouteChoiceMap choices={choices} selectedId={selectedId} onSelect={setChosenId} />
            <p className="text-xs text-text-muted">
              Solid line: the route you picked, with its main stops. Dashed: the other recommendations; tap one to
              switch. Trail lines are routed along OpenStreetMap paths and are approximate.
            </p>
          </div>
        )}

        <div className="space-y-4" role="radiogroup" aria-label="Recommended routes">
          {topRoutes.map(({ route, score, why }, idx) => {
            const selected = route.id === selectedId;
            return (
              <Card
                key={route.id}
                role="radio"
                aria-checked={selected}
                tabIndex={0}
                onClick={() => setChosenId(route.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setChosenId(route.id);
                  }
                }}
                className={`p-5 space-y-4 cursor-pointer transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ${
                  selected ? "border-accent ring-1 ring-accent/30 bg-surface" : "hover:border-text-muted"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant={idx === 0 ? "ok" : "neutral"}>#{idx + 1} Match</Badge>
                      <h3 className="text-xl font-bold text-text">{route.name}</h3>
                      <Badge variant="neutral">{route.region}</Badge>
                      {selected && (
                        <Badge variant="ok">
                          <MapPin className="w-3 h-3 mr-1" />
                          On map
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-text-muted">
                      <span className="font-mono tabular-nums">
                        {route.days[0]}–{route.days[1]}
                      </span>{" "}
                      days · Max <span className="font-mono tabular-nums">{route.maxAltitudeM.toLocaleString("en-US")} m</span> ·{" "}
                      {route.difficulty}
                      {!lines[route.id] && " · trail line not available yet"}
                    </p>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-xs text-text-muted font-mono uppercase block">Match Score</span>
                      <span className="text-2xl font-mono font-extrabold text-accent">{score}%</span>
                    </div>
                    <Link href={`/routes/${route.id}`} onClick={(e) => e.stopPropagation()}>
                      <Button variant={selected ? "primary" : "secondary"}>
                        View Route
                        <ArrowRight className="w-4 h-4 ml-1" />
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                    Why it fits:
                  </span>
                  <ul className="text-xs text-text space-y-1">
                    {why.map((reason) => (
                      <li key={reason} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
