import * as React from "react";
import type { AmsResult } from "@/lib/types";
import { formatNepalTime } from "@/lib/format";
import { Banner } from "../ui/banner";
import { Button } from "../ui/button";

export interface TodayPanelProps {
  /** null until the route data is ready. */
  ams: AmsResult | null;
  lastCheckinAt: string | null;
  due: boolean;
  onCheckin: () => void;
}

/** "How am I doing today?" The verdict wording comes from `evaluateAms` (ams-copy.ts). */
export function TodayPanel({ ams, lastCheckinAt, due, onCheckin }: TodayPanelProps) {
  const level = ams?.level ?? "ok";
  const first = ams?.actions[0];
  return (
    <Banner
      severity={level}
      headline={ams?.headline ?? "Today"}
      reasons={level !== "ok" && first ? [first] : undefined}
      actions={
        <>
          <Button variant={due ? "primary" : "secondary"} onClick={onCheckin}>
            {due ? "Check in now" : "Check in"}
          </Button>
          <span className="text-small text-text-muted">
            {lastCheckinAt ? `Last check-in ${formatNepalTime(lastCheckinAt)} NPT` : "No check-in yet"}
          </span>
        </>
      }
    />
  );
}
