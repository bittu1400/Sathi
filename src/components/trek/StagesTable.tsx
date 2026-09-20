import * as React from "react";
import { Moon, TriangleAlert } from "lucide-react";
import type { Stage, Waypoint } from "@/lib/types";
import { isFastGain } from "@/lib/ams";
import { formatAltitude, formatGain } from "@/lib/format";
import { Status } from "../ui/status";
import { Table, TableCards, type Column } from "../ui/table";

export interface StagesTableProps {
  stages: Stage[];
  waypoints: Waypoint[];
  className?: string;
}

interface Row extends Stage {
  from: string;
  to: string;
  gainM: number | null;
}

export function StagesTable({ stages, waypoints, className }: StagesTableProps) {
  const name = (id: string) => waypoints.find((w) => w.id === id)?.name ?? id;
  const rows: Row[] = stages.map((s, i) => ({
    ...s,
    from: name(s.fromId),
    to: name(s.toId),
    gainM: i > 0 ? s.sleepAltM - stages[i - 1]!.sleepAltM : null,
  }));

  const columns: Column<Row>[] = [
    { key: "day", header: "Day", numeric: true, cell: (r) => r.day },
    {
      key: "stage",
      header: "Stage",
      cell: (r) => (
        <span className="flex flex-wrap items-center gap-2">
          {r.isAcclimatization ? `${r.from}, rest day` : `${r.from} to ${r.to}`}
          {r.isAcclimatization && <Status tone="accent">Acclimatization</Status>}
        </span>
      ),
    },
    { key: "km", header: "Distance", numeric: true, cell: (r) => `${r.distanceKm} km` },
    { key: "ud", header: "Up / down", numeric: true, cell: (r) => `+${r.ascentM} / -${r.descentM} m` },
    { key: "h", header: "Hours", numeric: true, cell: (r) => `${r.hours} h` },
    {
      key: "sleep",
      header: "Sleep at",
      numeric: true,
      cell: (r) => (
        <span className="inline-flex flex-wrap items-center justify-end gap-2">
          <Moon className="size-4 text-text-muted" aria-hidden />
          {formatAltitude(r.sleepAltM)}
          {r.gainM !== null && isFastGain(r.sleepAltM, r.gainM) && (
            <Status tone="caution" icon={<TriangleAlert aria-hidden />}>
              Fast gain {formatGain(r.gainM)}
            </Status>
          )}
        </span>
      ),
    },
  ];

  return (
    <div className={className}>
      <div className="hidden md:block">
        <Table caption="Standard itinerary" columns={columns} rows={rows} rowKey={(r) => String(r.day)} />
      </div>
      <div className="md:hidden">
        <TableCards columns={columns} rows={rows} rowKey={(r) => String(r.day)} />
      </div>
    </div>
  );
}
