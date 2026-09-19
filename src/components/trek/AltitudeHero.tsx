import * as React from "react";
import { cn } from "cn";
import { Mountain } from "lucide-react";
import { formatGain } from "@/lib/format";

export interface AltitudeHeroProps {
  /** null = no GPS fix yet. */
  altitudeM: number | null;
  gainSinceLastNightM?: number;
  severity?: "ok" | "info" | "caution" | "warning" | "danger";
  className?: string;
}

export function AltitudeHero({
  altitudeM,
  gainSinceLastNightM,
  severity = "ok",
  className,
}: AltitudeHeroProps) {
  const severityColors = {
    ok: "text-ok bg-ok/10 border-ok/30",
    info: "text-info bg-info/10 border-info/30",
    caution: "text-caution bg-caution/15 border-caution/40",
    warning: "text-warning bg-warning/15 border-warning/40",
    danger: "text-danger bg-danger/15 border-danger/40 animate-pulse motion-reduce:animate-none",
  };

  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[var(--radius-lg)] p-6 shadow-md flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden",
        className
      )}
    >
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-semibold text-text-muted">
        <Mountain className="w-4 h-4 text-accent" />
        Current altitude
      </div>

      {altitudeM === null ? (
        <p className="py-3 text-lg font-semibold text-text-muted">Waiting for GPS…</p>
      ) : (
        <div className="flex items-baseline justify-center gap-2 font-mono tabular-nums">
          <span className="text-5xl sm:text-6xl font-extrabold text-text tracking-tight">
            {altitudeM.toLocaleString("en-US")}
          </span>
          <span className="text-xl text-text-muted font-sans font-medium">m</span>
        </div>
      )}

      {gainSinceLastNightM !== undefined && (
        <div
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-semibold border mt-2",
            severityColors[severity]
          )}
        >
          {formatGain(gainSinceLastNightM)} sleeping altitude since last night
        </div>
      )}
    </div>
  );
}
