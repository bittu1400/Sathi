import * as React from "react";
import { Stage, Waypoint } from "@/lib/types";
import { cn } from "cn";
import { AlertCircle, Moon } from "lucide-react";

export interface StagesTableProps {
  stages: Stage[];
  waypoints: Waypoint[];
  className?: string;
}

export function StagesTable({ stages, waypoints, className }: StagesTableProps) {
  const getWaypointName = (id: string) => {
    return waypoints.find((w) => w.id === id)?.name || id;
  };

  return (
    <div className={cn("overflow-x-auto border border-border rounded-[var(--radius)] bg-surface", className)}>
      <table className="w-full text-left text-sm border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-border bg-surface-2/60 text-xs font-semibold uppercase tracking-wider text-text-muted">
            <th className="p-3">Day</th>
            <th className="p-3">Route Stage</th>
            <th className="p-3 text-right">Distance</th>
            <th className="p-3 text-right">Asc / Desc</th>
            <th className="p-3 text-right">Hours</th>
            <th className="p-3 text-right">Sleep Alt</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {stages.map((stage, idx) => {
            const prevStage = idx > 0 ? stages[idx - 1] : null;
            const sleepGain =
              prevStage && stage.sleepAltM > 3000
                ? stage.sleepAltM - prevStage.sleepAltM
                : 0;
            const isAggressiveGain = sleepGain > 500;

            return (
              <tr
                key={stage.day}
                className={cn(
                  "hover:bg-surface-2/40 transition-colors",
                  stage.isAcclimatization && "bg-info/10 font-medium"
                )}
              >
                <td className="p-3 font-mono font-bold text-accent">
                  Day {stage.day}
                </td>
                <td className="p-3 font-medium">
                  <div className="flex items-center gap-1.5">
                    {getWaypointName(stage.fromId)}
                    <span className="text-text-muted">→</span>
                    {getWaypointName(stage.toId)}
                    {stage.isAcclimatization && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs bg-info/20 text-info border border-info/30">
                        Acclimatization
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-3 text-right font-mono tabular-nums">
                  {stage.distanceKm} km
                </td>
                <td className="p-3 text-right font-mono tabular-nums text-text-muted text-xs">
                  ↑{stage.ascentM}m / ↓{stage.descentM}m
                </td>
                <td className="p-3 text-right font-mono tabular-nums">
                  {stage.hours} h
                </td>
                <td className="p-3 text-right font-mono tabular-nums">
                  <div className="flex items-center justify-end gap-1.5">
                    <Moon className="w-3.5 h-3.5 text-text-muted" />
                    <span>{stage.sleepAltM.toLocaleString()} m</span>
                    {isAggressiveGain && (
                      <span
                        title="Faster than the 500 m/night guideline"
                        className="inline-flex items-center cursor-help text-caution"
                      >
                        <AlertCircle className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
