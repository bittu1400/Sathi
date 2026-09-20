import * as React from "react";
import { Wifi, WifiOff } from "lucide-react";
import type { Waypoint } from "@/lib/types";
import { formatAltitude, formatGain, formatKm } from "@/lib/format";
import { Panel } from "../ui/panel";
import { Status } from "../ui/status";

export interface NextWaypointProps {
  waypoint: Waypoint;
  /** null until there is a GPS fix. */
  distanceKm: number | null;
  altitudeDeltaM: number | null;
  className?: string;
}

const signal = { good: "ok", weak: "caution", none: "neutral", unknown: "neutral" } as const;

export function NextWaypoint({ waypoint, distanceKm, altitudeDeltaM, className }: NextWaypointProps) {
  return (
    <Panel title={waypoint.name} meta="Next waypoint" className={className}>
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1 font-mono tabular-nums">
          <p className="text-readout">{distanceKm === null ? "—" : formatKm(distanceKm)}</p>
          <p className="text-small text-text-muted">
            {formatAltitude(waypoint.altM)}
            {altitudeDeltaM !== null && ` · ${formatGain(altitudeDeltaM)}`}
          </p>
        </div>
        <Status tone={signal[waypoint.signal]} unverified={waypoint.signal === "unknown"} icon={waypoint.signal === "none" ? <WifiOff aria-hidden /> : <Wifi aria-hidden />}>
          {waypoint.signal === "unknown" ? "Signal unknown" : `${waypoint.signal} signal`}
        </Status>
      </div>
    </Panel>
  );
}
