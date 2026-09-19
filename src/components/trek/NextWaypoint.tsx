import * as React from "react";
import { Waypoint } from "@/lib/types";
import { Badge } from "../ui/badge";
import { Navigation, Wifi, WifiOff } from "lucide-react";
import { cn } from "cn";
import { formatAltitude, formatGain, formatKm } from "@/lib/format";

export interface NextWaypointProps {
  waypoint: Waypoint;
  /** null until there is a GPS fix. */
  distanceKm: number | null;
  altitudeDeltaM: number | null;
  className?: string;
}

export function NextWaypoint({
  waypoint,
  distanceKm,
  altitudeDeltaM,
  className,
}: NextWaypointProps) {
  return (
    <div
      className={cn(
        "bg-surface border border-border rounded-[var(--radius)] p-4 flex items-center justify-between gap-4 shadow-sm",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center shrink-0">
          <Navigation className="w-5 h-5 text-accent" />
        </div>
        <div className="space-y-0.5">
          <span className="text-xs font-mono uppercase tracking-wider text-text-muted">
            Next Waypoint
          </span>
          <h4 className="font-semibold text-base text-text">{waypoint.name}</h4>
          <div className="flex items-center gap-2 text-xs font-mono text-text-muted">
            <span>{formatAltitude(waypoint.altM)}</span>
            {altitudeDeltaM !== null && (
              <>
                <span>·</span>
                <span>{formatGain(altitudeDeltaM)}</span>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span className="text-lg font-mono font-bold text-accent">
          {distanceKm === null ? "—" : formatKm(distanceKm)}
        </span>
        <Badge
          variant={
            waypoint.signal === "good"
              ? "ok"
              : waypoint.signal === "weak"
              ? "caution"
              : "unverified"
          }
          className="text-[10px] py-0 px-2"
        >
          {waypoint.signal === "none" ? (
            <WifiOff className="w-3 h-3 mr-1" />
          ) : (
            <Wifi className="w-3 h-3 mr-1" />
          )}
          {waypoint.signal.toUpperCase()} SIGNAL
        </Badge>
      </div>
    </div>
  );
}
