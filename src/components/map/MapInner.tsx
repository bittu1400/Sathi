"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteDetail, Resource } from "@/lib/types";
import { ensurePMTilesProtocol, getMapStyle } from "./style";
import { addRouteLayers, addResourceLayers, setPositionLayer } from "./layers";
import { useTheme } from "../theme-toggle";

export interface MapProps {
  route?: RouteDetail;
  resources?: Resource[];
  position?: { lat: number; lng: number; accuracyM?: number | null };
  interactive?: boolean;
  className?: string;
  onResourceClick?: (resource: Resource) => void;
}

/**
 * The map is created once per route/theme; route, resources and position
 * update their sources in place, so GPS fixes don't rebuild the map.
 */
export default function MapInner({
  route,
  resources = [],
  position,
  interactive = true,
  className = "",
  onResourceClick,
}: MapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<maplibregl.Map | null>(null);
  const [basemapMissing, setBasemapMissing] = useState(false);
  const theme = useTheme();
  const routeId = route?.id;
  const firstCenter = useRef(position ?? null);

  useEffect(() => {
    ensurePMTilesProtocol();
    if (!container.current) return;

    const start = firstCenter.current;
    const map = new maplibregl.Map({
      container: container.current,
      style: getMapStyle(theme, route?.tilesUrl, true),
      center: start ? [start.lng, start.lat] : ((route?.line.coordinates[0] as [number, number]) ?? [86.7314, 27.687]),
      zoom: start ? 13 : 10,
      interactive,
      attributionControl: false,
    });
    map.addControl(new maplibregl.AttributionControl({ customAttribution: "© OpenStreetMap contributors, Protomaps" }));
    map.on("load", () => {
      if (route?.bbox) {
        const [w, s, e, n] = route.bbox;
        map.fitBounds([[w, s], [e, n]], { padding: 40, duration: 0 });
      }
      setLoaded(map);
    });
    map.on("error", (e) => {
      if ((e as { sourceId?: string }).sourceId === "protomaps") setBasemapMissing(true);
    });

    return () => {
      setLoaded(null);
      map.remove();
    };
    // Recreate only when the route or theme changes; other props update sources below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route object identity is irrelevant, routeId is the key
  }, [routeId, theme, interactive]);

  useEffect(() => {
    if (loaded && route) addRouteLayers(loaded, route);
  }, [loaded, route]);

  useEffect(() => {
    if (loaded && resources.length > 0) addResourceLayers(loaded, resources, onResourceClick);
  }, [loaded, resources, onResourceClick]);

  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (loaded) setPositionLayer(loaded, lat !== undefined && lng !== undefined ? { lat, lng } : null);
  }, [loaded, lat, lng]);

  return (
    <div
      className={`relative h-[350px] w-full overflow-hidden rounded-[var(--radius)] border border-border bg-surface ${className}`}
    >
      <div ref={container} className="h-full w-full" />
      {basemapMissing && (
        <p className="absolute left-2 top-2 rounded-[var(--radius-sm)] bg-surface/90 px-2 py-1 text-xs text-text-muted">
          Base map not available offline. Route, waypoints and help points are shown.
        </p>
      )}
    </div>
  );
}
