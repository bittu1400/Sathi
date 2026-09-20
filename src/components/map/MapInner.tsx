"use client";

import React, { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import { FileSource, PMTiles, Protocol } from "pmtiles";
import "maplibre-gl/dist/maplibre-gl.css";
import { Phone } from "lucide-react";
import type { RouteDetail, Resource } from "@/lib/types";
import { getPack, isUsableTilesUrl } from "@/lib/offline/packs";
import { getDiagramStyle, getMapStyle } from "./style";
import { Button } from "../ui/button";
import { Sheet, SheetContent } from "../ui/sheet";
import { Status } from "../ui/status";
import { addRouteLayers, addResourceLayers, setPositionLayer } from "./layers";

// MapLibre derives its worker URL from `import.meta.url`, which Turbopack doesn't
// emit: the worker 404s and no source ever loads, so the map stays empty. The copy
// in public/maplibre/ (scripts/copy-maplibre-worker.mjs) is served from our origin
// and cached by the service worker, so it also works offline.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

let protocol: Protocol | null = null;
function pmtilesProtocol(): Protocol {
  if (!protocol) {
    protocol = new Protocol();
    maplibregl.addProtocol("pmtiles", protocol.tile);
  }
  return protocol;
}

/**
 * The downloaded pack wins over the hosted tiles, so the basemap works with no
 * signal. A pack is registered under `{routeId}.pmtiles`, which is the key a
 * FileSource gets, and referenced by the style as `pmtiles://{routeId}.pmtiles`.
 */
async function resolveTilesSource(routeId?: string, tilesUrl?: string): Promise<string | undefined> {
  const registry = pmtilesProtocol();
  if (routeId) {
    const blob = await getPack(routeId).catch(() => undefined);
    if (blob) {
      const key = `${routeId}.pmtiles`;
      if (!registry.get(key)) registry.add(new PMTiles(new FileSource(new File([blob], key))));
      return key;
    }
  }
  return isUsableTilesUrl(tilesUrl) ? tilesUrl : undefined;
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
 * The map is created once per route; route, resources and position update their
 * sources in place, so GPS fixes don't rebuild the map. If the basemap can't
 * load, the style is swapped for the trail diagram and the layers are re-added:
 * the route, waypoints, resources and the GPS dot always render.
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
  // `gen` bumps on every style (re-)load, which is what re-adds our layers.
  const [ready, setReady] = useState<{ map: maplibregl.Map; gen: number } | null>(null);
  const [basemapMissing, setBasemapMissing] = useState(false);
  const [renderFailed, setRenderFailed] = useState(false);
  const [selected, setSelected] = useState<Resource | null>(null);
  const routeId = route?.id;
  const firstCenter = useRef(position ?? null);
  // The map's click handler is registered once, so it reads the latest props here.
  const resourcesRef = useRef(resources);
  const onResourceClickRef = useRef(onResourceClick);
  useEffect(() => {
    resourcesRef.current = resources;
    onResourceClickRef.current = onResourceClick;
  });

  useEffect(() => {
    let map: maplibregl.Map | null = null;
    let cancelled = false;

    const setup = async () => {
      const tiles = await resolveTilesSource(routeId, route?.tilesUrl);
      if (cancelled || !container.current) return;
      setBasemapMissing(!tiles);

      const start = firstCenter.current;
      const firstPoint = route?.line?.coordinates?.[0] as [number, number] | undefined;
      try {
        map = new maplibregl.Map({
          container: container.current,
          style: getMapStyle(tiles),
          center: start ? [start.lng, start.lat] : (firstPoint ?? [86.7314, 27.687]),
          zoom: start ? 13 : 10,
          interactive,
          attributionControl: false,
          // A page scroll over the map shouldn't zoom it.
          cooperativeGestures: interactive,
        });
      } catch (err) {
        // No WebGL (old device, blocked context): say so instead of a blank box.
        console.error("Map could not be created:", err);
        setRenderFailed(true);
        return;
      }
      const instance = map;

      if (interactive) {
        instance.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
        instance.addControl(
          new maplibregl.GeolocateControl({ positionOptions: { enableHighAccuracy: true } }),
          "top-right",
        );
      }
      instance.addControl(
        new maplibregl.AttributionControl({ customAttribution: "© OpenStreetMap contributors, Protomaps" }),
      );

      // Registered once per map: the layer doesn't have to exist yet.
      instance.on("click", "resources-markers", (e) => {
        const id = e.features?.[0]?.properties?.id;
        const target = resourcesRef.current.find((r) => r.id === id);
        if (target) {
          setSelected(target);
          onResourceClickRef.current?.(target);
        }
      });

      // `load` waits for tiles, which may never arrive; `styledata` only needs
      // the style, which is all addLayer needs.
      const onStyleReady = () => {
        if (cancelled) return;
        if (route?.bbox) {
          const [w, s, e, n] = route.bbox;
          instance.fitBounds([[w, s], [e, n]], { padding: 40, duration: 0 });
        }
        setReady((prev) => ({ map: instance, gen: (prev?.gen ?? 0) + 1 }));
      };
      instance.once("styledata", onStyleReady);

      let downgraded = !tiles;
      instance.on("error", (e) => {
        const sourceId = (e as { sourceId?: string }).sourceId;
        const message = e.error?.message ?? "";
        const basemapBroke = sourceId === "protomaps" || /pmtiles/i.test(message);
        if (!basemapBroke || downgraded || cancelled) return;
        // Tiles are unreachable or corrupt: fall back to the trail diagram.
        downgraded = true;
        setBasemapMissing(true);
        instance.setStyle(getDiagramStyle());
        instance.once("styledata", onStyleReady);
      });
    };

    setup();

    return () => {
      cancelled = true;
      setReady(null);
      map?.remove();
    };
    // Recreate only when the route changes; other props update sources below.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- route object identity is irrelevant, routeId is the key
  }, [routeId, interactive]);

  useEffect(() => {
    if (ready && route) addRouteLayers(ready.map, route);
  }, [ready, route]);

  useEffect(() => {
    if (ready && resources.length > 0) addResourceLayers(ready.map, resources);
  }, [ready, resources]);

  const lat = position?.lat;
  const lng = position?.lng;
  useEffect(() => {
    if (ready) setPositionLayer(ready.map, lat !== undefined && lng !== undefined ? { lat, lng } : null);
  }, [ready, lat, lng]);

  return (
    <div className={`relative aspect-[4/3] w-full overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface lg:aspect-auto lg:h-[420px] ${className}`}>
      <div ref={container} role="region" aria-label={route ? `Map of ${route.name}` : "Map"} className="h-full w-full" />
      {renderFailed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center">
          <p className="text-body font-medium text-text">This device can&apos;t draw the map</p>
          <p className="max-w-xs text-small text-text-muted">Waypoints and the emergency directory below still work.</p>
        </div>
      )}
      {basemapMissing && !renderFailed && (
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
