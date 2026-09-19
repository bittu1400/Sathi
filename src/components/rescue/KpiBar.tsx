import React from "react";
import { cn } from "cn";

interface KpiBarProps {
  openSosCount: number;
  activeTreksCount: number;
  trekkersAbove4000m: number;
  alerts24hCount: number;
}

function Kpi({ label, value, tone, className }: { label: string; value: number; tone?: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-surface-2/40 px-2.5 py-1 text-text-muted", className)}>
      <span>{label}</span>
      <span className={cn("font-mono text-sm font-bold tabular-nums text-text", tone)}>{value}</span>
    </div>
  );
}

export function KpiBar({ openSosCount, activeTreksCount, trekkersAbove4000m, alerts24hCount }: KpiBarProps) {
  return (
    <div className="flex items-center gap-3 text-xs" aria-live="polite">
      <div
        className={cn(
          "flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1 font-medium",
          openSosCount > 0 ? "border-sos/50 bg-sos/15 text-sos" : "border-border bg-surface-2/40 text-text-muted",
        )}
      >
        <span className={cn("h-2 w-2 rounded-full", openSosCount > 0 ? "bg-sos" : "bg-ok")} />
        <span>Open SOS</span>
        <span className="font-mono text-sm font-bold tabular-nums">{openSosCount}</span>
      </div>
      <Kpi label="Active treks" value={activeTreksCount} />
      <Kpi label="Above 4,000 m" value={trekkersAbove4000m} className="hidden sm:flex" />
      <Kpi
        label="Alerts (24h)"
        value={alerts24hCount}
        tone={alerts24hCount > 0 ? "text-caution" : undefined}
        className="hidden md:flex"
      />
    </div>
  );
}
