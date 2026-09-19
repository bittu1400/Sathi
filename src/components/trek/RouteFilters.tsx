"use client";

import * as React from "react";
import { Chip, ChipGroup } from "../ui/chip";
import { Select } from "../ui/field";
import type { Difficulty, Terrain } from "@/lib/types";

export interface FilterState {
  difficulty?: Difficulty;
  daysRange?: "short" | "medium" | "long";
  terrain: Terrain[];
  sortBy: "data" | "shortest" | "highest";
}

export const emptyFilters: FilterState = { terrain: [], sortBy: "data" };

export const daysLabels = { short: "Up to 7 days", medium: "8–14 days", long: "15+ days" } as const;
const difficulties: Difficulty[] = ["easy", "moderate", "strenuous", "extreme"];
const terrains: Terrain[] = ["river_valley", "forest", "alpine", "ridge", "glacier", "cultural"];
const label = (t: string) => t.replace("_", " ");

export function RouteFilters({ filters, onChange }: { filters: FilterState; onChange: (next: FilterState) => void }) {
  const toggleTerrain = (t: Terrain) =>
    onChange({ ...filters, terrain: filters.terrain.includes(t) ? filters.terrain.filter((x) => x !== t) : [...filters.terrain, t] });

  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-label text-text-muted">Difficulty</legend>
        <ChipGroup>
          {difficulties.map((d) => (
            <Chip key={d} selected={filters.difficulty === d} onClick={() => onChange({ ...filters, difficulty: filters.difficulty === d ? undefined : d })}>
              {d}
            </Chip>
          ))}
        </ChipGroup>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-label text-text-muted">Duration</legend>
        <ChipGroup>
          {(Object.keys(daysLabels) as (keyof typeof daysLabels)[]).map((k) => (
            <Chip key={k} selected={filters.daysRange === k} onClick={() => onChange({ ...filters, daysRange: filters.daysRange === k ? undefined : k })}>
              {daysLabels[k]}
            </Chip>
          ))}
        </ChipGroup>
      </fieldset>
      <fieldset className="space-y-2">
        <legend className="text-label text-text-muted">Terrain</legend>
        <ChipGroup>
          {terrains.map((t) => (
            <Chip key={t} selected={filters.terrain.includes(t)} onClick={() => toggleTerrain(t)}>
              {label(t)}
            </Chip>
          ))}
        </ChipGroup>
      </fieldset>
      <label className="flex items-center justify-between gap-4 border-t border-line pt-4 text-small text-text">
        Sort by
        <Select
          className="w-auto"
          value={filters.sortBy}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value as FilterState["sortBy"] })}
        >
          <option value="data">Full data first</option>
          <option value="shortest">Shortest</option>
          <option value="highest">Highest altitude</option>
        </Select>
      </label>
    </div>
  );
}
