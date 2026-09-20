"use client";

import * as React from "react";
import { Car, Footprints, TrendingUp } from "lucide-react";
import { formatGain, formatKm } from "@/lib/format";
import type { PlannedRoute } from "@/lib/plan/types";

function hours(seconds: number): string {
  const h = seconds / 3600;
  if (h < 1) return `${Math.round(seconds / 60)} min`;
  return `${h.toFixed(h < 10 ? 1 : 0)} h`;
}

export interface RouteCardsProps {
  routes: PlannedRoute[];
  selectedId: string;
  days: number;
  onSelect: (id: string) => void;
}

export function RouteCards({ routes, selectedId, days, onSelect }: RouteCardsProps) {
  return (
    <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {routes.map((route) => {
        const selected = route.id === selectedId;
        return (
          <li key={route.id} className="min-w-[80%] snap-start sm:min-w-[18rem]">
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => onSelect(route.id)}
              className={`flex h-full w-full flex-col gap-2 rounded-[var(--radius)] border p-3 text-left transition-colors duration-[var(--dur-fast)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                selected ? "border-accent bg-accent-bg" : "border-line bg-surface-2 hover:bg-surface-3"
              }`}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className={`text-body font-medium ${selected ? "text-accent" : "text-text"}`}>
                  {route.label}
                </span>
                <span className="font-mono text-small tabular-nums text-text-muted">
                  {days} {days === 1 ? "day" : "days"}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-small tabular-nums text-text-muted">
                <span>{formatKm(route.distanceM / 1000)}</span>
                {route.ascentM !== null && (
                  <span className="inline-flex items-center gap-1">
                    <TrendingUp className="size-4" aria-hidden />
                    {formatGain(route.ascentM)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  {route.source === "driving" ? (
                    <Car className="size-4" aria-hidden />
                  ) : (
                    <Footprints className="size-4" aria-hidden />
                  )}
                  {hours(route.durationS)}
                </span>
              </div>
              {route.source === "driving" && (
                <p className="text-small text-text-muted">Road route — too far to walk end to end.</p>
              )}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
