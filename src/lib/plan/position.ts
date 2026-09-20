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
/** Geolocation is either there for the whole page's life or it never was. */
const subscribeNever = () => () => {};
const hasGeolocation = () => typeof navigator !== "undefined" && "geolocation" in navigator;

export function usePosition(): PositionState {
  const [status, setStatus] = React.useState<PositionStatus>("locating");
  const [coords, setCoords] = React.useState<Coords | null>(null);
  const watchId = React.useRef<number | null>(null);
  // Read through useSyncExternalStore, not at render time: the server has no
  // navigator, and a plain check there makes the first client render differ
  // from the HTML, which React reports as a hydration mismatch.
  const supported = React.useSyncExternalStore(subscribeNever, hasGeolocation, () => true);

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
