"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { RouteDetail, Resource } from "@/lib/types";
import { getMapStyle } from "./style";
import { addRouteLayers, addResourceLayers } from "./layers";
import { TopoBackground } from "../ui/topo-background";

let protocolAdded = false;
function ensurePMTilesProtocol() {
  if (!protocolAdded) {
    const protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
    protocolAdded = true;
  }
}

export interface MapProps {
  route?: RouteDetail;
  resources?: Resource[];
  position?: { lat: number; lng: number; accuracyM?: number | null };
  progressIndex?: number;
  sos?: { lat: number; lng: number }[];
  tilesSource?: "remote" | Blob;
  interactive?: boolean;
  className?: string;
  onResourceClick?: (resource: Resource) => void;
}

export default function MapInner({
  route,
  resources = [],
  position,
  progressIndex = 0,
  interactive = true,
  className = "",
  onResourceClick,
}: MapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const [loadError, setLoadError] = useState(false);

  useEffect(() => {
    ensurePMTilesProtocol();
    if (!mapContainer.current || mapRef.current) return;

    const theme =
      (document.documentElement.getAttribute("data-theme") as
        | "dark"
        | "sunlight") || "dark";

    const style = getMapStyle(theme, route?.tilesUrl);

    const map = new maplibregl.Map({
      container: mapContainer.current,
      style,
      center: position
        ? [position.lng, position.lat]
        : route?.line?.coordinates[0]
        ? (route.line.coordinates[0] as [number, number])
        : [86.7314, 27.687],
      zoom: position ? 13 : 10,
      interactive,
      attributionControl: false,
    });

    map.addControl(
      new maplibregl.AttributionControl({
        customAttribution: "© OpenStreetMap contributors, Protomaps",
      })
    );

    map.on("load", () => {
      if (route) {
        addRouteLayers(map, route, progressIndex);
        if (route.bbox) {
          map.fitBounds(
            [
              [route.bbox[0], route.bbox[1]],
              [route.bbox[2], route.bbox[3]],
            ],
            { padding: 40, duration: 1000 }
          );
        }
      }
      if (resources.length > 0) {
        addResourceLayers(map, resources, onResourceClick);
      }
    });

    map.on("error", () => {
      setLoadError(true);
    });

    mapRef.current = map;

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [route, resources, position, progressIndex, interactive, onResourceClick]);

  return (
    <div
      className={`relative w-full h-[350px] rounded-[var(--radius)] overflow-hidden border border-border bg-surface ${className}`}
    >
      {loadError && <TopoBackground className="opacity-15" />}
      <div ref={mapContainer} className="w-full h-full" />
      {route && loadError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-surface/80 backdrop-blur-sm text-center">
          <TopoBackground />
          <p className="text-sm font-semibold text-text z-10">
            Offline Map View — {route.name}
          </p>
          <p className="text-xs text-text-muted z-10 mt-1">
            Route casing and key waypoints loaded from offline cache
          </p>
        </div>
      )}
    </div>
  );
}
