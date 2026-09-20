"use client";

import * as React from "react";
import { Car, ChevronDown, Footprints, MapPin, TrendingUp } from "lucide-react";
import { formatGain, formatKm } from "@/lib/format";
import type { PlannedRoute } from "@/lib/plan/types";
import { DayPlan } from "./DayPlan";

function hours(seconds: number): string {
  const h = seconds / 3600;
  if (h < 1) return `${Math.round(seconds / 60)} min`;
  return `${h.toFixed(h < 10 ? 1 : 0)} h`;
}

export interface RouteCardsProps {
  routes: PlannedRoute[];
  selectedId: string;
  onSelect: (id: string) => void;
}

export function RouteCards({ routes, selectedId, onSelect }: RouteCardsProps) {
  const [openId, setOpenId] = React.useState<string | null>(null);

  return (
    <ul className="flex snap-x snap-mandatory gap-3 overflow-x-auto pb-1">
      {routes.map((route) => {
        const selected = route.id === selectedId;
        const open = route.id === openId;
        return (
          <li key={route.id} className="min-w-[85%] snap-start sm:min-w-[20rem]">
            <div
              className={`flex h-full flex-col rounded-[var(--radius)] border transition-colors duration-[var(--dur-fast)] ${
                selected ? "border-accent bg-accent-bg" : "border-line bg-surface-2"
              }`}
            >
              <button
                type="button"
                aria-pressed={selected}
                onClick={() => onSelect(route.id)}
                className="flex flex-col gap-2 p-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className={`text-body font-medium ${selected ? "text-accent" : "text-text"}`}>
                    {route.label}
                  </span>
                  <span className="font-mono text-small tabular-nums text-text-muted">
                    {route.days.length} {route.days.length === 1 ? "day" : "days"}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-small tabular-nums text-text-muted">
                  <span>{formatKm(route.distanceM / 1000)}</span>
                  {route.ascentM !== null && route.ascentM > 0 && (
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

                {route.stops.length > 0 && (
                  <p className="flex items-start gap-1 text-small text-text-muted">
                    <MapPin className="mt-0.5 size-4 shrink-0" aria-hidden />
                    <span className="line-clamp-2">{route.stops.map((stop) => stop.name).join(" · ")}</span>
                  </p>
                )}

                {route.source === "driving" && (
                  <p className="text-small text-text-muted">Road route — too far to walk end to end.</p>
                )}
              </button>

              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenId(open ? null : route.id)}
                className="flex min-h-12 items-center justify-center gap-1 border-t border-line text-small text-text-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                {open ? "Hide the days" : "See the days"}
                <ChevronDown
                  className={`size-4 transition-transform duration-[var(--dur-fast)] motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                  aria-hidden
                />
              </button>

              {open && (
                <div className="max-h-56 overflow-y-auto border-t border-line p-3">
                  <DayPlan days={route.days} kind={route.kind} />
                </div>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
