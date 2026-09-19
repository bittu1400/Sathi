import * as React from "react";
import { Waypoint } from "@/lib/types";
import { Moon } from "lucide-react";

export interface SleepPickerProps {
  waypoints: Waypoint[];
  selectedWaypointId: string;
  onChange: (wpId: string, altM: number) => void;
}

export function SleepPicker({ waypoints, selectedWaypointId, onChange }: SleepPickerProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-text-muted">
        <Moon className="w-4 h-4 text-accent" />
        Where will you sleep tonight?
      </div>

      <select
        value={selectedWaypointId}
        onChange={(e) => {
          const wp = waypoints.find((w) => w.id === e.target.value);
          if (wp) {
            onChange(wp.id, wp.altM);
          }
        }}
        className="w-full bg-surface-2 border border-border rounded-[var(--radius-sm)] p-3 text-sm text-text font-medium focus:outline-none focus:border-accent"
      >
        {waypoints.map((wp) => (
          <option key={wp.id} value={wp.id}>
            {wp.name} ({wp.altM.toLocaleString()} m)
          </option>
        ))}
      </select>
    </div>
  );
}
