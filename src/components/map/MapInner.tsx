"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { Phone } from "lucide-react";
import type { RouteDetail, Resource } from "@/lib/types";
import { getMapStyle } from "./style";
import { Button } from "../ui/button";
import { Sheet, SheetContent } from "../ui/sheet";
import { Status } from "../ui/status";
import { addRouteLayers, addResourceLayers, setPositionLayer } from "./layers";

let protocolAdded = false;
function ensurePMTilesProtocol() {
  if (!protocolAdded) {
    maplibregl.addProtocol("pmtiles", new Protocol().tile);
    protocolAdded = true;
  }
}

export interface MapProps {
  route?: RouteDetail;
  resources?: Resource[];
  position?: { lat: number; lng: number; accuracyM?: number | null };
  interactive?: boolean;
  className?: string;
  onResourceClick?: (resource: Resource) => void;
}

/**
 * The map is created once per route; route, resources and position
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
  const [selected, setSelected] = useState<Resource | null>(null);
  const routeId = route?.id;
  const firstCenter = useRef(position ?? null);

  useEffect(() => {
    ensurePMTilesProtocol();
    if (!container.current) return;

    const start = firstCenter.current;
    const map = new maplibregl.Map({
      container: container.current,
      style: getMapStyle(route?.tilesUrl),
      center: start ? [start.lng, start.lat] : ((route?.line.coordinates[0] as [number, number]) ?? [86.7314, 27.687]),
      zoom: start ? 13 : 10,
      interactive,
      attributionControl: false,
      // A page scroll over the map shouldn't zoom it.
      cooperativeGestures: interactive,
    });
    if (interactive) {
      map.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
      map.addControl(new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }), "top-right");
    }
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
    // Recreate only when the route changes; other props update sources below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route object identity is irrelevant, routeId is the key
  }, [routeId, interactive]);

  const handleResourceClick = useCallback(
    (r: Resource) => {
      setSelected(r);
      onResourceClick?.(r);
    },
    [onResourceClick]
  );

  useEffect(() => {
    if (loaded && route) addRouteLayers(loaded, route);
  }, [loaded, route]);

  useEffect(() => {
    if (loaded && resources.length > 0) addResourceLayers(loaded, resources, handleResourceClick);
  }, [loaded, resources, handleResourceClick]);

  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (loaded) setPositionLayer(loaded, lat !== undefined && lng !== undefined ? { lat, lng } : null);
  }, [loaded, lat, lng]);

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface lg:aspect-auto lg:h-[420px] ${className}`}>
      <div ref={container} role="region" aria-label={route ? `Map of ${route.name}` : "Map"} className="h-full w-full" />
      {basemapMissing && (
        <Status className="absolute bottom-2 left-2 bg-surface">Trail diagram · base map not downloaded</Status>
      )}
      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent title={selected?.name ?? "Details"} description={selected?.notes}>
          {selected?.phone ? (
            <Button asChild>
              <a href={`tel:${selected.phone}`}>
                <Phone className="size-4" aria-hidden /> Call {selected.phone}
              </a>
            </Button>
          ) : (
            <p className="text-text-muted">No number listed.</p>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
