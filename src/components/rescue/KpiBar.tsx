import React from "react";

interface KpiBarProps {
  openSosCount: number;
  activeTreksCount: number;
  trekkersAbove4000m: number;
  alerts24hCount: number;
}

export function KpiBar({
  openSosCount,
  activeTreksCount,
  trekkersAbove4000m,
  alerts24hCount,
}: KpiBarProps) {
  return (
    <div className="flex items-center gap-4 text-xs">
      {/* Open SOS */}
      <div
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-medium transition-colors ${
          openSosCount > 0
            ? "bg-red-500/15 border-red-500/40 text-red-400 animate-pulse"
            : "bg-muted/40 border-border text-muted-foreground"
        }`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            openSosCount > 0 ? "bg-red-500" : "bg-emerald-500"
          }`}
        />
        <span>Open SOS:</span>
        <span className="font-mono font-bold text-sm">
          {openSosCount}
        </span>
      </div>

      {/* Active Treks */}
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 text-muted-foreground">
        <span>Active Treks:</span>
        <span className="font-mono font-bold text-sm text-foreground">
          {activeTreksCount}
        </span>
      </div>

      {/* Trekkers > 4,000m */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 text-muted-foreground">
        <span>Above 4,000 m:</span>
        <span className="font-mono font-bold text-sm text-foreground">
          {trekkersAbove4000m}
        </span>
      </div>

      {/* Alerts 24h */}
      <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-muted/20 text-muted-foreground">
        <span>Alerts (24h):</span>
        <span
          className={`font-mono font-bold text-sm ${
            alerts24hCount > 0 ? "text-amber-400" : "text-foreground"
          }`}
        >
          {alerts24hCount}
        </span>
      </div>
    </div>
  );
}
