"use client";

import { useEffect, useRef, useState } from "react";
import * as maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { RouteLine } from "@/lib/data";
import { ensurePMTilesProtocol, getMapStyle } from "./style";
import { useTheme } from "../theme-toggle";

export interface RouteChoice {
  id: string;
  name: string;
  rank: number; // 1-based
  line: RouteLine;
}

export interface RouteChoiceMapProps {
  choices: RouteChoice[];
  selectedId: string;
  onSelect?: (id: string) => void;
}

function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(`--${name}`).trim();
}

function setData(map: maplibregl.Map, id: string, data: GeoJSON.FeatureCollection) {
  const source = map.getSource(id) as maplibregl.GeoJSONSource | undefined;
  if (source) source.setData(data);
  else map.addSource(id, { type: "geojson", data });
}

/**
 * All recommended routes on one map: the chosen one is highlighted with its
 * stops, the others are dashed and clickable so they can be checked too.
 */
export default function RouteChoiceMapInner({ choices, selectedId, onSelect }: RouteChoiceMapProps) {
  const container = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<maplibregl.Map | null>(null);
  const theme = useTheme();
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  });
  const tilesKey = [...new Set(choices.map((c) => c.line.tilesUrl))].sort().join(",");

  useEffect(() => {
    ensurePMTilesProtocol();
    if (!container.current) return;
    const m = new maplibregl.Map({
      container: container.current,
      style: getMapStyle(theme, tilesKey.split(","), true),
      center: [84.6, 28.2],
      zoom: 6,
      attributionControl: false,
    });
    m.addControl(new maplibregl.AttributionControl({ customAttribution: "© OpenStreetMap contributors, Protomaps" }));
    m.addControl(new maplibregl.NavigationControl({ showCompass: false }), "top-right");
    m.on("load", () => {
      setData(m, "choices", { type: "FeatureCollection", features: [] });
      setData(m, "stops", { type: "FeatureCollection", features: [] });
      const other = ["!=", ["get", "selected"], true] as maplibregl.FilterSpecification;
      const selected = ["==", ["get", "selected"], true] as maplibregl.FilterSpecification;
      m.addLayer({
        id: "choices-other",
        type: "line",
        source: "choices",
        filter: other,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": token("text-muted"), "line-width": 3, "line-dasharray": [2, 1.5], "line-opacity": 0.85 },
      });
      // Wide invisible line so the dashed alternatives are easy to tap.
      m.addLayer({
        id: "choices-other-hit",
        type: "line",
        source: "choices",
        filter: other,
        paint: { "line-color": token("bg"), "line-width": 24, "line-opacity": 0 },
      });
      m.addLayer({
        id: "choices-selected-casing",
        type: "line",
        source: "choices",
        filter: selected,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": token("bg"), "line-width": 9, "line-opacity": 0.85 },
      });
      m.addLayer({
        id: "choices-selected",
        type: "line",
        source: "choices",
        filter: selected,
        layout: { "line-join": "round", "line-cap": "round" },
        paint: { "line-color": token("accent"), "line-width": 5 },
      });
      m.addLayer({
        id: "choices-labels",
        type: "symbol",
        source: "choices",
        layout: {
          "symbol-placement": "line",
          "text-field": ["concat", "#", ["to-string", ["get", "rank"]], " ", ["get", "name"]],
          "text-font": ["Noto Sans Medium"],
          "text-size": 12,
          "symbol-spacing": 400,
        },
        paint: { "text-color": token("text"), "text-halo-color": token("bg"), "text-halo-width": 1.5 },
      });
      m.addLayer({
        id: "stops-circles",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": ["case", ["get", "end"], 7, 5],
          "circle-color": token("accent"),
          "circle-stroke-width": 2,
          "circle-stroke-color": token("bg"),
        },
      });
      m.addLayer({
        id: "stops-labels",
        type: "symbol",
        source: "stops",
        minzoom: 9,
        layout: {
          "text-field": ["get", "name"],
          "text-font": ["Noto Sans Regular"],
          "text-size": 12,
          "text-offset": [0, 1.1],
          "text-anchor": "top",
        },
        paint: { "text-color": token("text"), "text-halo-color": token("bg"), "text-halo-width": 1.5 },
      });
      m.on("click", "choices-other-hit", (e) => {
        const id = e.features?.[0]?.properties?.id;
        if (typeof id === "string") onSelectRef.current?.(id);
      });
      m.on("mouseenter", "choices-other-hit", () => (m.getCanvas().style.cursor = "pointer"));
      m.on("mouseleave", "choices-other-hit", () => (m.getCanvas().style.cursor = ""));
      setMap(m);
    });
    return () => {
      setMap(null);
      m.remove();
    };
  }, [theme, tilesKey]);

  useEffect(() => {
    if (!map) return;
    setData(map, "choices", {
      type: "FeatureCollection",
      features: choices.map((c) => ({
        type: "Feature",
        properties: { id: c.id, name: c.name, rank: c.rank, selected: c.id === selectedId },
        geometry: c.line.line,
      })),
    });
    const chosen = choices.find((c) => c.id === selectedId);
    const stops = chosen?.line.stops ?? [];
    setData(map, "stops", {
      type: "FeatureCollection",
      features: stops.map((s, i) => ({
        type: "Feature",
        properties: { name: s.name, end: i === 0 || i === stops.length - 1 },
        geometry: { type: "Point", coordinates: [s.lng, s.lat] },
      })),
    });
    if (chosen) {
      const [w, s, e, n] = chosen.line.bbox;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      map.fitBounds([[w, s], [e, n]], { padding: 48, duration: reduce ? 0 : 800 });
    }
  }, [map, choices, selectedId]);

  return (
    <div className="relative h-[420px] w-full overflow-hidden rounded-[var(--radius)] border border-border bg-surface">
      <div ref={container} className="h-full w-full" />
    </div>
  );
}
