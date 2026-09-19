"use client";

import * as React from "react";
import { formatAgo, formatGain } from "@/lib/format";
import { isFastGain } from "@/lib/ams";
import { useNow } from "@/lib/use-now";
import { Panel } from "../ui/panel";
import { Readout } from "../ui/readout";

export interface AltitudeHeroProps {
  /** null = no GPS fix yet. */
  altitudeM: number | null;
  gainSinceLastNightM?: number;
  updatedAt?: string;
  accuracyM?: number | null;
  className?: string;
}

const STALE_MS = 15 * 60_000;

export function AltitudeHero({ altitudeM, gainSinceLastNightM, updatedAt, accuracyM, className }: AltitudeHeroProps) {
  const now = useNow();
  const stale = now !== null && updatedAt !== undefined && now - Date.parse(updatedAt) > STALE_MS;
  const freshness =
    updatedAt && now !== null
      ? `updated ${formatAgo(updatedAt, now)}${accuracyM != null ? ` · ±${Math.round(accuracyM)} m` : ""}`
      : undefined;
  const fast = altitudeM !== null && gainSinceLastNightM !== undefined && isFastGain(altitudeM, gainSinceLastNightM);

  return (
    <Panel className={className}>
      {altitudeM === null ? (
        <Readout size="xl" label="Altitude" value="—" freshness="Waiting for GPS…" />
      ) : (
        <Readout
          size="xl"
          label="Altitude"
          value={altitudeM.toLocaleString("en-US")}
          unit="m"
          delta={
            gainSinceLastNightM !== undefined
              ? { text: `${formatGain(gainSinceLastNightM)} sleeping altitude since last night${fast ? " · faster than guidelines" : ""}`, severity: fast ? "caution" : undefined }
              : undefined
          }
          freshness={freshness}
          stale={stale}
        />
      )}
    </Panel>
  );
}
