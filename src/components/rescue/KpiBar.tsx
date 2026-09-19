import React from "react";
import { cn } from "@/lib/utils";

interface KpiBarProps {
  openSosCount: number;
  activeTreksCount: number;
  trekkersAbove4000m: number;
  alerts24hCount: number;
}

function Kpi({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <div className="flex items-baseline gap-2 px-4 py-2">
      <span className="text-label text-text-muted">{label}</span>
      <span className={cn("font-mono text-h2 tabular-nums", tone)}>{value}</span>
    </div>
  );
}

export function KpiBar({ openSosCount, activeTreksCount, trekkersAbove4000m, alerts24hCount }: KpiBarProps) {
  return (
    <div className="flex flex-wrap divide-x divide-line border-b border-line bg-surface" aria-live="polite">
      <Kpi label="Open SOS" value={openSosCount} tone={openSosCount > 0 ? "text-sos" : undefined} />
      <Kpi label="Active treks" value={activeTreksCount} />
      <Kpi label="Above 4,000 m" value={trekkersAbove4000m} />
      <Kpi label="Alerts 24 h" value={alerts24hCount} tone={alerts24hCount > 0 ? "text-caution" : undefined} />
    </div>
  );
}
