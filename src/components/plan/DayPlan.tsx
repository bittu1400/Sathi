"use client";

import * as React from "react";
import { Bed, MapPin } from "lucide-react";
import { formatGain, formatKm } from "@/lib/format";
import type { DayLeg, PlanKind } from "@/lib/plan/types";

export function DayPlan({ days, kind }: { days: DayLeg[]; kind: PlanKind }) {
  if (days.length === 0) return null;
  return (
    <ol className="flex flex-col gap-3">
      {days.map((leg) => (
        <li key={leg.day} className="flex gap-3">
          <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-3 font-mono text-small tabular-nums text-text">
            {leg.day}
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-small tabular-nums text-text">
              {formatKm(leg.distanceM / 1000)}
              {leg.ascentM !== null && leg.ascentM > 0 && <> · {formatGain(leg.ascentM)}</>} · {leg.hours} h
            </p>
            {leg.highlights.length > 0 && (
              <p className="mt-0.5 flex items-start gap-1 text-small text-text-muted">
                <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <span className="min-w-0">{leg.highlights.join(" · ")}</span>
              </p>
            )}
            {leg.endName && (
              <p className="mt-0.5 flex items-center gap-1 text-small text-text-muted">
                <Bed className="size-3.5 shrink-0" aria-hidden />
                {kind === "trek" ? "Night" : "Ends near"} {leg.endName}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
