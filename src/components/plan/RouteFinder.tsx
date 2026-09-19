"use client";

import * as React from "react";
import Link from "next/link";
import { Terrain, Season, RouteSummary } from "@/lib/types";
import { Chip, ChipGroup } from "../ui/chip";
import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { Compass, Sparkles, ArrowRight, Check } from "lucide-react";

export interface RouteFinderProps {
  routes: RouteSummary[];
}

export function RouteFinder({ routes }: RouteFinderProps) {
  const [selectedTerrain, setSelectedTerrain] = React.useState<Terrain[]>([
    "forest",
    "ridge",
  ]);
  const [days, setDays] = React.useState<number>(5);
  const [fitness, setFitness] = React.useState<"low" | "medium" | "high">("low");
  const [season, setSeason] = React.useState<Season>("spring");

  const rankedRoutes = React.useMemo(() => {
    return routes
      .map((r) => {
        let score = 0;
        const why: string[] = [];

        // Terrain match
        const terrainMatch = r.terrain.filter((t) => selectedTerrain.includes(t));
        if (terrainMatch.length > 0) {
          score += terrainMatch.length * 20;
          why.push(`Matches terrain: ${terrainMatch.map((t) => t.replace("_", " ")).join(", ")}`);
        }

        // Days fit
        if (days >= r.days[0] && days <= r.days[1]) {
          score += 30;
          why.push(`Fits your ${days}-day timeframe`);
        } else if (Math.abs(r.days[0] - days) <= 2) {
          score += 15;
        }

        // Fitness & altitude comfort
        if (fitness === "low" && r.maxAltitudeM <= 3500) {
          score += 25;
          why.push("Comfortable max altitude for lower fitness");
        } else if (fitness === "high" && r.maxAltitudeM > 5000) {
          score += 25;
          why.push("High altitude challenge suitable for high fitness");
        }

        // Season
        if (r.bestSeasons.includes(season)) {
          score += 20;
          why.push(`Great condition in ${season}`);
        }

        return { route: r, score, why };
      })
      .sort((a, b) => b.score - a.score);
  }, [routes, selectedTerrain, days, fitness, season]);

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
                size="sm"
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

      {/* Ranked Results */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Compass className="w-5 h-5 text-accent" />
          Recommended Routes ({rankedRoutes.length})
        </h2>

        <div className="space-y-4">
          {rankedRoutes.map(({ route, score, why }, idx) => (
            <Card
              key={route.id}
              className={`p-5 space-y-4 transition-all ${
                idx === 0 ? "border-accent ring-1 ring-accent/30 bg-surface" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {idx === 0 && <Badge variant="ok">#1 Match</Badge>}
                    <h3 className="text-xl font-bold text-text">{route.name}</h3>
                    <Badge variant="neutral">{route.region}</Badge>
                  </div>
                  <p className="text-xs text-text-muted">
                    {route.days[0]}–{route.days[1]} Days · Max {route.maxAltitudeM.toLocaleString()} m · {route.difficulty}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <span className="text-xs text-text-muted font-mono uppercase block">Match Score</span>
                    <span className="text-2xl font-mono font-extrabold text-accent">{score}%</span>
                  </div>
                  <Link href={`/routes/${route.id}`}>
                    <Button variant="primary" size="sm">
                      View Route
                      <ArrowRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                </div>
              </div>

              {why.length > 0 && (
                <div className="space-y-1">
                  <span className="text-xs font-semibold text-text-muted uppercase tracking-wider block">
                    Why it fits:
                  </span>
                  <ul className="text-xs text-text space-y-1">
                    {why.map((reason, rIdx) => (
                      <li key={rIdx} className="flex items-center gap-1.5">
                        <Check className="w-3.5 h-3.5 text-ok shrink-0" />
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
