"use client";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getBasemapUrl } from "./style";
import { setPositionLayer } from "./layers";
import type { Coords } from "@/lib/plan/position";
import { NEPAL_CENTER } from "@/lib/plan/position";
import type { PlannedRoute, Poi } from "@/lib/plan/types";

// Turbopack doesn't emit MapLibre's `import.meta.url` worker, so the worker 404s
// and no tile ever loads. scripts/copy-maplibre-worker.mjs puts a copy here.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export interface PlanMapProps {
  position: Coords | null;
  /** CARTO basemap key; the map falls back to the keyless style without it. */
  basemapKey?: string;
  routes?: PlannedRoute[];
  selectedRouteId?: string | null;
  /** Stops of the selected route, drawn in visiting order. */
  stops?: Poi[];
  /** Called once the map is usable, so the screen can fly it around. */
  onReady?: (map: maplibregl.Map) => void;
}

function routeCollection(routes: PlannedRoute[], selectedId: string | null): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: routes.map((route) => ({
      type: "Feature",
      properties: { id: route.id, selected: route.id === selectedId },
      geometry: route.geometry,
    })),
  };
}

function boundsOf(routes: PlannedRoute[]): maplibregl.LngLatBounds | null {
  const bounds = new maplibregl.LngLatBounds();
  let any = false;
  for (const route of routes) {
    for (const position of route.geometry.coordinates) {
      const [lng, lat] = position;
      if (typeof lng !== "number" || typeof lat !== "number") continue;
      bounds.extend([lng, lat]);
      any = true;
    }
  }
  return any ? bounds : null;
}

/**
 * The planner's full-bleed map. Unlike `MapInner` (one trek, fixed aspect,
 * offline packs) this one fills the viewport and is panned like a maps app.
 */
export default function PlanMapInner({
  position,
  basemapKey,
  routes = [],
  selectedRouteId = null,
  stops = [],
  onReady,
}: PlanMapProps) {
  const container = React.useRef<HTMLDivElement>(null);
  const [map, setMap] = React.useState<maplibregl.Map | null>(null);
  // Checked at render, not in the effect: an old device or a blocked context
  // gives no WebGL and MapLibre would throw on construction.
  const [webgl] = React.useState(
    () => typeof document === "undefined" || document.createElement("canvas").getContext("webgl2") !== null,
  );
  const onReadyRef = React.useRef(onReady);
  const centred = React.useRef(false);
  React.useEffect(() => {
    onReadyRef.current = onReady;
  });

  React.useEffect(() => {
    if (!container.current || !webgl) return;
    let instance: maplibregl.Map;
    try {
      instance = new maplibregl.Map({
        container: container.current,
        style: getBasemapUrl("light", basemapKey),
        center: [NEPAL_CENTER.lng, NEPAL_CENTER.lat],
        zoom: 6.5,
        attributionControl: false,
        // The map IS the page here, so a one-finger drag must pan it.
        cooperativeGestures: false,
      });
    } catch (err) {
      console.error("Map could not be created:", err);
      return;
    }
    instance.addControl(new maplibregl.AttributionControl({ compact: true }), "bottom-left");
    instance.once("styledata", () => {
      setMap(instance);
      onReadyRef.current?.(instance);
    });
    return () => {
      setMap(null);
      instance.remove();
    };
  }, [webgl, basemapKey]);

  // First real fix flies to the device; later fixes only move the dot, so the
  // map doesn't yank itself back while the user is panning.
  React.useEffect(() => {
    if (!map) return;
    setPositionLayer(map, position ? { lat: position.lat, lng: position.lng } : null);
    // The shared layer is painted for the trekker screens' dark basemap; over
    // pale tiles it needs the map palette to stay visible.
    if (map.getLayer("me-dot")) {
      const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
      map.setPaintProperty("me-dot", "circle-color", css("map-route"));
      map.setPaintProperty("me-dot", "circle-stroke-color", "#ffffff");
      map.setPaintProperty("me-halo", "circle-color", css("map-route"));
    }
    if (position && !centred.current) {
      centred.current = true;
      map.flyTo({ center: [position.lng, position.lat], zoom: 13, duration: 900 });
    }
  }, [map, position]);

  // The selected route is drawn on top and in the accent colour; the others stay
  // visible but recede, so all three read as one set of options.
  React.useEffect(() => {
    if (!map) return;
    const data = routeCollection(routes, selectedRouteId);
    const source = map.getSource("plan-routes") as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource("plan-routes", { type: "geojson", data });

    if (!map.getLayer("plan-routes-line")) {
      const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
      map.addLayer({
        id: "plan-routes-line",
        type: "line",
        source: "plan-routes",
        layout: { "line-cap": "round", "line-join": "round", "line-sort-key": ["case", ["get", "selected"], 1, 0] },
        paint: {
          "line-color": ["case", ["get", "selected"], css("map-route"), css("map-route-dim")],
          "line-width": ["case", ["get", "selected"], 6, 3],
          "line-opacity": ["case", ["get", "selected"], 1, 0.7],
        },
      });
    }
  }, [map, routes, selectedRouteId]);

  // Numbered pins for the stops of whichever route is selected.
  React.useEffect(() => {
    if (!map) return;
    const data: GeoJSON.FeatureCollection = {
      type: "FeatureCollection",
      features: stops.map((stop, index) => ({
        type: "Feature",
        properties: { label: String(index + 1), name: stop.name },
        geometry: { type: "Point", coordinates: [stop.lng, stop.lat] },
      })),
    };
    const source = map.getSource("plan-stops") as maplibregl.GeoJSONSource | undefined;
    if (source) source.setData(data);
    else map.addSource("plan-stops", { type: "geojson", data });

    if (!map.getLayer("plan-stops-dot")) {
      const css = (name: string) => getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
      map.addLayer({
        id: "plan-stops-dot",
        type: "circle",
        source: "plan-stops",
        paint: {
          "circle-radius": 12,
          "circle-color": css("map-stop"),
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.addLayer({
        id: "plan-stops-label",
        type: "symbol",
        source: "plan-stops",
        layout: { "text-field": ["get", "label"], "text-size": 12, "text-allow-overlap": true },
        paint: { "text-color": "#ffffff" },
      });
    }
  }, [map, stops]);

  // New results reframe the map; picking one of them does not, so the view
  // doesn't jump under the thumb while comparing.
  const routeSetKey = routes.map((r) => r.id).join(",");
  React.useEffect(() => {
    if (!map) return;
    const bounds = boundsOf(routes);
    if (!bounds) return;
    map.fitBounds(bounds, { padding: { top: 96, bottom: 280, left: 40, right: 40 }, duration: 900 });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reframe per result set, not per render of the same set
  }, [map, routeSetKey]);

  if (!webgl) {
    return (
      <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-surface p-4 text-center">
        <p className="text-body font-medium text-text">This device can&apos;t draw the map</p>
        <p className="max-w-xs text-small text-text-muted">Try a different browser or device.</p>
      </div>
    );
  }
  return <div ref={container} role="region" aria-label="Map of Nepal" className="h-full w-full" />;
}
