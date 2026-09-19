"use client";

import { useEffect, useState } from "react";
import type { Position, RouteDetail } from "@/lib/types";
import { estimateAltitude, haversineKm } from "@/lib/geo";
import { newId } from "@/lib/id";
import { recordPosition } from "@/lib/trek-log";

const MIN_INTERVAL_MS = 120_000;
const MIN_MOVE_M = 50;

export type GpsState = "waiting" | "tracking" | "denied" | "unavailable";

/**
 * Watches GPS while trek mode is open. A fix is stored (through the outbox)
 * every 2 minutes or every 50 m. No fake fallback: without a fix, position is null.
 */
export function useTrackPosition(route: RouteDetail | null, trekId: string | null) {
  const [position, setPosition] = useState<Position | null>(null);
  const [state, setState] = useState<GpsState>(() =>
    typeof navigator !== "undefined" && !("geolocation" in navigator) ? "unavailable" : "waiting",
  );

  useEffect(() => {
    if (!route || !trekId || !("geolocation" in navigator)) return;

    let last: { time: number; lat: number; lng: number } | null = null;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const { latitude: lat, longitude: lng, accuracy, altitude, altitudeAccuracy } = pos.coords;
        setState("tracking");
        const now = Date.now();
        const moved = last ? haversineKm(last, { lat, lng }) * 1000 : Infinity;
        if (last && now - last.time < MIN_INTERVAL_MS && moved < MIN_MOVE_M) return;
        last = { time: now, lat, lng };

        const fix: Position = {
          id: newId(),
          trekId,
          lat,
          lng,
          altM: Math.round(estimateAltitude(route, { lat, lng }, altitude, altitudeAccuracy)),
          accuracyM: Math.round(accuracy),
          recordedAt: new Date(pos.timestamp).toISOString(),
          source: "gps",
        };
        setPosition(fix);
        recordPosition(fix).catch(() => {});
      },
      (err) => setState(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable"),
      // SPEC §14: low-power GPS; SOS asks for a single high-accuracy fix instead.
      { enableHighAccuracy: false, maximumAge: 60_000, timeout: 30_000 },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [route, trekId]);

  return { position, state };
}
