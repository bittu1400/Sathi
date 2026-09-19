import * as React from "react";
import { cn } from "cn";
import { Moon } from "lucide-react";

export interface NightRecord {
  dayNumber: number;
  placeName: string;
  altitudeM: number;
  gainM?: number;
}

export interface AltitudeLadderProps {
  nights: NightRecord[];
  className?: string;
}

export function AltitudeLadder({ nights, className }: AltitudeLadderProps) {
  if (!nights || nights.length === 0) {
    return (
      <div className="p-4 text-center text-text-muted text-sm border border-border rounded-[var(--radius)] bg-surface">
        No sleeping altitude history yet
      </div>
    );
  }

  return (
    <div className={cn("bg-surface border border-border rounded-[var(--radius)] p-4 space-y-3", className)}>
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-text-muted pb-2 border-b border-border/60">
        <span className="flex items-center gap-1.5">
          <Moon className="w-3.5 h-3.5 text-accent" />
          Sleeping Altitude History
        </span>
        <span>Night Gain</span>
      </div>

      <div className="space-y-2">
        {nights.map((night, idx) => {
          const isHighAltitude = night.altitudeM >= 3000;
          const isAggressiveGain =
            isHighAltitude && night.gainM !== undefined && night.gainM > 500;

          return (
            <div
              key={idx}
              className="flex items-center justify-between p-2.5 rounded-[var(--radius-sm)] bg-surface-2/60 hover:bg-surface-2 transition-colors"
            >
              <div className="flex flex-col">
                <span className="text-xs text-text-muted font-medium">
                  Day {night.dayNumber} · {night.placeName}
                </span>
                <span className="text-base font-mono font-semibold text-text">
                  {night.altitudeM.toLocaleString()} m
                </span>
              </div>

              {night.gainM !== undefined ? (
                <div className="text-right">
                  <span
                    className={cn(
                      "text-sm font-mono font-medium px-2 py-0.5 rounded-full border",
                      isAggressiveGain
                        ? "bg-caution/15 text-caution border-caution/40"
                        : "bg-surface-3 text-text-muted border-border"
                    )}
                  >
                    {night.gainM >= 0 ? `+${night.gainM}` : night.gainM} m
                  </span>
                </div>
              ) : (
                <span className="text-xs text-text-faint font-mono">—</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
