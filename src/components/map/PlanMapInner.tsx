"use client";

import * as React from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { getRasterStyle } from "./style";
import { setPositionLayer } from "./layers";
import type { Coords } from "@/lib/plan/position";
import { NEPAL_CENTER } from "@/lib/plan/position";

// Turbopack doesn't emit MapLibre's `import.meta.url` worker, so the worker 404s
// and no tile ever loads. scripts/copy-maplibre-worker.mjs puts a copy here.
maplibregl.setWorkerUrl("/maplibre/maplibre-gl-worker.mjs");

export interface PlanMapProps {
  position: Coords | null;
  /** Called once the map is usable, so the screen can fly it around. */
  onReady?: (map: maplibregl.Map) => void;
}

/**
 * The planner's full-bleed map. Unlike `MapInner` (one trek, fixed aspect,
 * offline packs) this one fills the viewport and is panned like a maps app.
 */
export default function PlanMapInner({ position, onReady }: PlanMapProps) {
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
        style: getRasterStyle(),
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
  }, [webgl]);

  // First real fix flies to the device; later fixes only move the dot, so the
  // map doesn't yank itself back while the user is panning.
  React.useEffect(() => {
    if (!map) return;
    setPositionLayer(map, position ? { lat: position.lat, lng: position.lng } : null);
    if (position && !centred.current) {
      centred.current = true;
      map.flyTo({ center: [position.lng, position.lat], zoom: 13, duration: 900 });
    }
  }, [map, position]);

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
