"use client";

import { useEffect, useState } from "react";
import { Position, RouteDetail } from "@/lib/types";
import { estimateAltitude, haversineKm } from "../geo";

export function useTrackPosition(route?: RouteDetail | null) {
  const [currentPosition, setCurrentPosition] = useState<Position | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !("geolocation" in navigator)) return;

    let lastTime = 0;
    let lastLat = 0;
    let lastLng = 0;

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        const distM =
          haversineKm({ lat: lastLat, lng: lastLng }, { lat, lng }) * 1000;

        // Store if >= 2 min elapsed or moved >= 50 m
        if (now - lastTime >= 120000 || distM >= 50 || lastTime === 0) {
          lastTime = now;
          lastLat = lat;
          lastLng = lng;

          const gpsAlt = pos.coords.altitude;
          const gpsAccuracy = pos.coords.altitudeAccuracy;
          const altM =
            route?.waypoints
              ? estimateAltitude(
                  route,
                  { lat, lng },
                  gpsAlt ?? null,
                  gpsAccuracy ?? null,
                )
              : (gpsAlt ?? 3440);

          const newPos: Position = {
            id: `pos-${now}`,
            trekId: "active-trek",
            lat,
            lng,
            altM: Math.round(altM),
            accuracyM: pos.coords.accuracy ? Math.round(pos.coords.accuracy) : 15,
            recordedAt: new Date().toISOString(),
            source: "gps",
          };

          setCurrentPosition(newPos);
        }
      },
      () => {
        // Fallback default position (e.g. Dingboche in EBC) if GPS disabled/unsupported
        setCurrentPosition({
          id: "pos-fallback",
          trekId: "active-trek",
          lat: 27.892,
          lng: 86.831,
          altM: 4410,
          accuracyM: 20,
          recordedAt: new Date().toISOString(),
          source: "demo",
        });
      },
      {
        enableHighAccuracy: false,
        maximumAge: 60000,
        timeout: 10000,
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [route]);

  return currentPosition;
}
