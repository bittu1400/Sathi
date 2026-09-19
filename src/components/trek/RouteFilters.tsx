"use client";

import * as React from "react";
import { Chip, ChipGroup } from "../ui/chip";
import { Difficulty, Terrain } from "@/lib/types";

export interface FilterState {
  difficulty?: Difficulty;
  daysRange?: "short" | "medium" | "long";
  altitudeRange?: "low" | "medium" | "high";
  terrain: Terrain[];
  sortBy: "popular" | "shortest" | "highest";
}

export interface RouteFiltersProps {
  filters: FilterState;
  onChange: (newFilters: FilterState) => void;
}

export function RouteFilters({ filters, onChange }: RouteFiltersProps) {
  const toggleTerrain = (t: Terrain) => {
    const has = filters.terrain.includes(t);
    const updated = has
      ? filters.terrain.filter((x) => x !== t)
      : [...filters.terrain, t];
    onChange({ ...filters, terrain: updated });
  };

  return (
    <div className="bg-surface border border-border rounded-[var(--radius)] p-4 space-y-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Filter & Sort Routes
        </h3>
        <button
          type="button"
          onClick={() =>
            onChange({
              terrain: [],
              sortBy: "popular",
            })
          }
          className="text-xs text-accent hover:underline cursor-pointer"
        >
          Reset Filters
        </button>
      </div>

      <div className="space-y-3">
        {/* Difficulty */}
        <div>
          <span className="text-xs font-medium text-text block mb-1.5">Difficulty</span>
          <ChipGroup>
            {(["easy", "moderate", "strenuous", "extreme"] as Difficulty[]).map((d) => (
              <Chip
                key={d}
                selected={filters.difficulty === d}
                onClick={() =>
                  onChange({
                    ...filters,
                    difficulty: filters.difficulty === d ? undefined : d,
                  })
                }
              >
                {d}
              </Chip>
            ))}
          </ChipGroup>
        </div>

        {/* Duration */}
        <div>
          <span className="text-xs font-medium text-text block mb-1.5">Duration</span>
          <ChipGroup>
            <Chip
              selected={filters.daysRange === "short"}
              onClick={() =>
                onChange({
                  ...filters,
                  daysRange: filters.daysRange === "short" ? undefined : "short",
                })
              }
            >
              ≤ 7 Days
            </Chip>
            <Chip
              selected={filters.daysRange === "medium"}
              onClick={() =>
                onChange({
                  ...filters,
                  daysRange: filters.daysRange === "medium" ? undefined : "medium",
                })
              }
            >
              8–14 Days
            </Chip>
            <Chip
              selected={filters.daysRange === "long"}
              onClick={() =>
                onChange({
                  ...filters,
                  daysRange: filters.daysRange === "long" ? undefined : "long",
                })
              }
            >
              15+ Days
            </Chip>
          </ChipGroup>
        </div>

        {/* Terrain */}
        <div>
          <span className="text-xs font-medium text-text block mb-1.5">Terrain Type</span>
          <ChipGroup>
            {(["river_valley", "forest", "alpine", "ridge", "glacier", "cultural"] as Terrain[]).map(
              (t) => (
                <Chip
                  key={t}
                  selected={filters.terrain.includes(t)}
                  onClick={() => toggleTerrain(t)}
                >
                  {t.replace("_", " ")}
                </Chip>
              )
            )}
          </ChipGroup>
        </div>

        {/* Sort */}
        <div className="pt-2 border-t border-border/60 flex items-center justify-between">
          <span className="text-xs font-medium text-text">Sort by</span>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              onChange({
                ...filters,
                sortBy: e.target.value as FilterState["sortBy"],
              })
            }
            className="bg-surface-2 border border-border rounded-lg px-3 py-1.5 text-xs text-text focus:outline-none focus:border-accent"
          >
            <option value="popular">Most Popular</option>
            <option value="shortest">Shortest Duration</option>
            <option value="highest">Highest Altitude</option>
          </select>
        </div>
      </div>
    </div>
  );
}
