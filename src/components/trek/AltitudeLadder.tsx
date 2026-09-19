import * as React from "react";
import { Moon, TriangleAlert } from "lucide-react";
import { isFastGain } from "@/lib/ams";
import { formatAltitude, formatGain } from "@/lib/format";
import { Panel } from "../ui/panel";
import { Status } from "../ui/status";

export interface NightRecord {
  dayNumber: number;
  placeName: string;
  altitudeM: number;
  gainM?: number;
}

export function AltitudeLadder({ nights, className }: { nights: NightRecord[]; className?: string }) {
  if (nights.length === 0)
    return (
      <Panel title="Sleeping altitude" className={className}>
        <p className="text-text-muted">No sleeping altitude history yet. It fills in as you check in.</p>
      </Panel>
    );

  return (
    <Panel title="Sleeping altitude" meta="Night gain" className={className}>
      <ul className="divide-y divide-line">
        {nights.map((n) => {
          const fast = n.gainM !== undefined && isFastGain(n.altitudeM, n.gainM);
          return (
            <li key={`${n.dayNumber}-${n.placeName}`} className="flex items-center justify-between gap-3 py-2.5">
              <div>
                <p className="flex items-center gap-1.5 text-small text-text-muted">
                  <Moon className="size-3.5" aria-hidden /> Day {n.dayNumber} · {n.placeName}
                </p>
                <p className="font-mono text-body tabular-nums">{formatAltitude(n.altitudeM)}</p>
              </div>
              {n.gainM !== undefined &&
                (fast ? (
                  <Status tone="caution" icon={<TriangleAlert aria-hidden />}>
                    {formatGain(n.gainM)} · over guideline
                  </Status>
                ) : (
                  <span className="font-mono text-body tabular-nums text-text-muted">{formatGain(n.gainM)}</span>
                ))}
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}
