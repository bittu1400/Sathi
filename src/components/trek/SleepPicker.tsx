import * as React from "react";
import type { Waypoint } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { Field, Select } from "../ui/field";

export interface SleepPickerProps {
  waypoints: Waypoint[];
  selectedWaypointId: string;
  onChange: (wpId: string, altM: number) => void;
}

export function SleepPicker({ waypoints, selectedWaypointId, onChange }: SleepPickerProps) {
  return (
    <Field label="Where will you sleep tonight?" hint="Your sleeping altitude is what the altitude guidance uses.">
      {(p) => (
        <Select
          {...p}
          value={selectedWaypointId}
          onChange={(e) => {
            const wp = waypoints.find((w) => w.id === e.target.value);
            if (wp) onChange(wp.id, wp.altM);
          }}
        >
          {waypoints.map((wp) => (
            <option key={wp.id} value={wp.id}>
              {wp.name} ({formatAltitude(wp.altM)})
            </option>
          ))}
        </Select>
      )}
    </Field>
  );
}
