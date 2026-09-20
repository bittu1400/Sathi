"use client";

import * as React from "react";

export interface Coords {
  lat: number;
  lng: number;
  accuracyM: number | null;
}

export type PositionStatus = "idle" | "locating" | "ready" | "denied" | "unavailable";

export interface PositionState {
  status: PositionStatus;
  coords: Coords | null;
  /** Ask again: the locate button, and once on mount. */
  locate: () => void;
}

/** Centre of Nepal, used until (or unless) the device gives a real fix. */
export const NEPAL_CENTER = { lat: 28.3949, lng: 84.124 };

/**
 * Watches the device position. A refused or missing permission is a normal
 * state, not an error: the map stays on Nepal and the button says so.
 */
export function usePosition(): PositionState {
  const [status, setStatus] = React.useState<PositionStatus>("locating");
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const watchId = React.useRef<number | null>(null);
  // Derived, not state: a browser without geolocation never changes its mind,
  // and computing it here keeps the mount effect free of setState.
  const supported = typeof navigator !== "undefined" && "geolocation" in navigator;

  const locate = React.useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    if (watchId.current !== null) return;
    watchId.current = navigator.geolocation.watchPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracyM: Number.isFinite(pos.coords.accuracy) ? pos.coords.accuracy : null,
        });
        setStatus("ready");
      },
      (err) => {
        setStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable");
        if (watchId.current !== null) {
          navigator.geolocation.clearWatch(watchId.current);
          watchId.current = null;
        }
      },
      { enableHighAccuracy: true, maximumAge: 15_000, timeout: 20_000 },
    );
  }, []);

  React.useEffect(() => {
    locate();
    return () => {
      if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current);
      watchId.current = null;
    };
  }, [locate]);

  return { status: supported ? status : "unavailable", coords, locate };
}
