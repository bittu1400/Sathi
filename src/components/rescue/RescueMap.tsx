"use client";

import React, { useState } from "react";
import { AlertTriangle, Hospital, Layers, MapPin } from "lucide-react";
import type { RouteDetail } from "@/lib/types";
import type { ActiveTrekLocation, SosWithContext } from "@/lib/db/queries";
import { formatAltitude } from "@/lib/format";
import { getResources, getRoute } from "@/lib/data";
import { TopoBackground } from "@/components/ui/topo-background";
import { cn } from "cn";

interface RescueMapProps {
  events: SosWithContext[];
  treks: ActiveTrekLocation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type Bounds = { minLat: number; maxLat: number; minLng: number; maxLng: number };
const RESOURCES = getResources();
const EBC = getRoute("ebc") as RouteDetail;
// Nothing to show yet: frame the EBC route rather than an empty ocean.
const FALLBACK: Bounds = { minLng: EBC.bbox[0], minLat: EBC.bbox[1], maxLng: EBC.bbox[2], maxLat: EBC.bbox[3] };

function boundsOf(points: { lat: number; lng: number }[]): Bounds {
  if (points.length === 0) return FALLBACK;
  const lats = points.map((p) => p.lat);
  const lngs = points.map((p) => p.lng);
  const b = { minLat: Math.min(...lats), maxLat: Math.max(...lats), minLng: Math.min(...lngs), maxLng: Math.max(...lngs) };
  // Pad by 25 % (at least ~5 km) so markers never sit on the edge.
  const padLat = Math.max((b.maxLat - b.minLat) * 0.25, 0.05);
  const padLng = Math.max((b.maxLng - b.minLng) * 0.25, 0.05);
  return { minLat: b.minLat - padLat, maxLat: b.maxLat + padLat, minLng: b.minLng - padLng, maxLng: b.maxLng + padLng };
}

/**
 * Schematic coordination map: equirectangular projection fitted to the live
 * SOS and trekker positions, with the real route lines. Works without tiles.
 */
export function RescueMap({ events, treks, selectedId, onSelect }: RescueMapProps) {
  const [showResources, setShowResources] = useState(true);

  const active = events.filter((e) => e.status !== "resolved" && e.lat !== null && e.lng !== null);
  const trekPoints = treks.flatMap((t) => (t.position ? [t.position] : []));
  const bounds = boundsOf([...active.map((e) => ({ lat: e.lat!, lng: e.lng! })), ...trekPoints]);
  const inBounds = (p: { lat: number; lng: number }) =>
    p.lat >= bounds.minLat && p.lat <= bounds.maxLat && p.lng >= bounds.minLng && p.lng <= bounds.maxLng;
  const project = (lat: number, lng: number) => ({
    x: ((lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100,
    y: ((bounds.maxLat - lat) / (bounds.maxLat - bounds.minLat)) * 100,
  });

  const routes = [...new Set(treks.map((t) => t.routeId))]
    .map((id) => getRoute(id))
    .filter((r): r is RouteDetail => r !== null && "line" in r);
  const resources = showResources ? RESOURCES.filter(inBounds) : [];

  return (
    <div className="relative flex h-full w-full select-none flex-col overflow-hidden bg-surface-2">
      <TopoBackground className="opacity-10" />

      <div className="absolute left-3 top-3 z-20 flex items-center gap-2">
        <div className="flex items-center gap-1.5 rounded-[var(--radius-sm)] border border-border bg-bg/80 px-3 py-1.5 text-xs shadow-lg backdrop-blur-md">
          <span className="h-2 w-2 rounded-full bg-ok" />
          <span className="font-semibold">Live positions</span>
          <span className="ml-1 font-mono text-[11px] text-text-muted">schematic, not to scale for navigation</span>
        </div>
        <button
          type="button"
          aria-pressed={showResources}
          onClick={() => setShowResources((v) => !v)}
          className={cn(
            "flex items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 py-1.5 text-xs font-medium shadow backdrop-blur-md",
            showResources ? "border-accent bg-accent/15 text-accent" : "border-border bg-bg/80 text-text-muted hover:text-text",
          )}
        >
          <Layers className="h-3.5 w-3.5" /> Help points
        </button>
      </div>

      <div className="relative h-full w-full flex-1">
        <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {routes.map((route) => (
            <polyline
              key={route.id}
              points={route.line.coordinates.map(([lng, lat]) => {
                const { x, y } = project(lat!, lng!);
                return `${x},${y}`;
              }).join(" ")}
              className="fill-none stroke-accent/50"
              strokeWidth="0.6"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {resources.map((r) => {
          const { x, y } = project(r.lat, r.lng);
          const clinic = r.kind === "hra_post" || r.kind === "hospital" || r.kind === "health_post";
          return (
            <div key={r.id} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <div
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded border text-[10px] font-bold shadow-md",
                  clinic ? "border-ok bg-ok/80 text-bg" : r.kind === "helipad" ? "border-info bg-info/80 text-bg" : "border-border bg-surface-3 text-text",
                )}
              >
                {r.kind === "helipad" ? "H" : clinic ? <Hospital className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
              </div>
              <div className="absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg/95 px-2 py-1 text-[11px] shadow-xl group-hover:block">
                <p className="font-semibold">{r.name}</p>
                {r.altM ? <p className="font-mono text-[10px] text-text-muted">{formatAltitude(r.altM)}</p> : null}
              </div>
            </div>
          );
        })}

        {treks.map((t) => {
          if (!t.position) return null;
          const { x, y } = project(t.position.lat, t.position.lng);
          return (
            <div key={t.trekId} className="group absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: `${x}%`, top: `${y}%` }}>
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-info bg-info/30 shadow-lg">
                <span className="h-1.5 w-1.5 rounded-full bg-info" />
              </span>
              <div className="absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-bg/95 px-2 py-1 text-[11px] shadow-xl group-hover:block">
                <p className="font-semibold">{t.trekkerName}</p>
                <p className="font-mono text-[10px] text-info">{t.position.altM !== null ? formatAltitude(t.position.altM) : "Altitude unknown"}</p>
              </div>
            </div>
          );
        })}

        {active.map((e) => {
          const { x, y } = project(e.lat!, e.lng!);
          const selected = e.id === selectedId;
          return (
            <button
              key={e.id}
              type="button"
              onClick={() => onSelect(e.id)}
              aria-label={`SOS from ${e.trekkerName}`}
              className="absolute z-30 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <span className="relative flex items-center justify-center">
                {e.status === "open" && (
                  <span className="absolute h-10 w-10 animate-ping rounded-full bg-sos/30 motion-reduce:animate-none" />
                )}
                <span
                  className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-full text-sos-ink shadow-2xl",
                    selected ? "scale-125 border-2 border-text bg-sos" : "border border-sos/60 bg-sos/90",
                  )}
                >
                  <AlertTriangle className="h-3.5 w-3.5" />
                </span>
              </span>
              <span
                className={cn(
                  "mt-1.5 whitespace-nowrap rounded border px-2 py-0.5 font-mono text-[10px] font-bold shadow-md",
                  selected ? "border-text bg-sos text-sos-ink" : "border-sos/50 bg-bg/90 text-sos",
                )}
              >
                {e.trekkerName}
                {e.altM !== null && ` · ${formatAltitude(e.altM)}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-4 rounded-[var(--radius-sm)] border border-border bg-bg/80 px-3 py-1.5 text-[11px] text-text-muted shadow-lg backdrop-blur-md">
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-sos" /> SOS</span>
        <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-info" /> Trekker</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-ok" /> Clinic / HRA</span>
        <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-info" /> Helipad</span>
      </div>
    </div>
  );
}
