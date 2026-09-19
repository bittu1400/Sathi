"use client";

import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, Hospital, Layers, MapPin } from "lucide-react";
import type { RouteDetail } from "@/lib/types";
import type { ActiveTrekLocation, SosWithContext } from "@/lib/db/queries";
import { formatAltitude } from "@/lib/format";
import { getResources, getRoute } from "@/lib/data";
import { Chip } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

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

/** Tooltip on hover and on keyboard focus. */
function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-1.5 hidden -translate-x-1/2 whitespace-nowrap rounded-[var(--radius)] border border-line-strong bg-surface-3 px-2 py-1 text-small shadow-[var(--shadow-overlay)] group-focus-within:block group-hover:block">
      {children}
    </div>
  );
}

/**
 * Schematic coordination map: equirectangular projection fitted to the live
 * SOS and trekker positions, scaled uniformly (never stretched), with the
 * real route lines. Works without tiles.
 */
export function RescueMap({ events, treks, selectedId, onSelect }: RescueMapProps) {
  const [showResources, setShowResources] = useState(true);
  const box = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 800, h: 600 });

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setSize({ w: Math.max(200, entry.contentRect.width), h: Math.max(200, entry.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const active = events.filter((e) => e.status !== "resolved" && e.lat !== null && e.lng !== null);
  const trekPoints = treks.flatMap((t) => (t.position ? [t.position] : []));
  const bounds = boundsOf([...active.map((e) => ({ lat: e.lat!, lng: e.lng! })), ...trekPoints]);
  const inBounds = (p: { lat: number; lng: number }) =>
    p.lat >= bounds.minLat && p.lat <= bounds.maxLat && p.lng >= bounds.minLng && p.lng <= bounds.maxLng;

  // One scale for both axes; longitude is shrunk by cos(latitude).
  const kx = Math.cos((((bounds.minLat + bounds.maxLat) / 2) * Math.PI) / 180);
  const spanX = (bounds.maxLng - bounds.minLng) * kx;
  const spanY = bounds.maxLat - bounds.minLat;
  const scale = Math.min(size.w / spanX, size.h / spanY);
  const offX = (size.w - spanX * scale) / 2;
  const offY = (size.h - spanY * scale) / 2;
  const project = (lat: number, lng: number) => ({
    x: offX + (lng - bounds.minLng) * kx * scale,
    y: offY + (bounds.maxLat - lat) * scale,
  });

  const routes = [...new Set(treks.map((t) => t.routeId))]
    .map((id) => getRoute(id))
    .filter((r): r is RouteDetail => r !== null && "line" in r);
  const resources = showResources ? RESOURCES.filter(inBounds) : [];

  return (
    <div className="relative flex h-full w-full select-none flex-col overflow-hidden bg-surface">
      <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2">
        <span className="rounded-[var(--radius)] border border-line-strong bg-surface-3 px-3 py-1.5 text-small">
          Live positions <span className="text-text-muted">· schematic, not for navigation</span>
        </span>
        <Chip selected={showResources} onClick={() => setShowResources((v) => !v)}>
          <Layers className="size-4" aria-hidden /> Help points
        </Chip>
      </div>

      <div ref={box} className="relative h-full w-full flex-1" role="region" aria-label="Map of active treks and SOS incidents">
        <svg className="pointer-events-none absolute inset-0" width={size.w} height={size.h} aria-hidden>
          {routes.map((route) => (
            <polyline
              key={route.id}
              points={route.line.coordinates
                .map(([lng, lat]) => {
                  const { x, y } = project(lat!, lng!);
                  return `${x.toFixed(1)},${y.toFixed(1)}`;
                })
                .join(" ")}
              className="fill-none stroke-accent/50"
              strokeWidth={2}
            />
          ))}
        </svg>

        {resources.map((r) => {
          const { x, y } = project(r.lat, r.lng);
          const clinic = r.kind === "hra_post" || r.kind === "hospital" || r.kind === "health_post";
          return (
            <div key={r.id} className="group absolute z-10 -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
              <button
                type="button"
                aria-label={`${r.name}${r.altM ? `, ${formatAltitude(r.altM)}` : ""}`}
                className={cn(
                  "flex size-6 cursor-default items-center justify-center rounded-[var(--radius-sm)] border text-label",
                  clinic ? "border-ok bg-ok text-ink" : r.kind === "helipad" ? "border-accent bg-accent text-ink" : "border-line-strong bg-surface-3 text-text"
                )}
              >
                {r.kind === "helipad" ? "H" : clinic ? <Hospital className="size-3.5" aria-hidden /> : <MapPin className="size-3.5" aria-hidden />}
              </button>
              <Tip>
                <p className="font-medium">{r.name}</p>
                {r.altM ? <p className="font-mono text-text-muted">{formatAltitude(r.altM)}</p> : null}
              </Tip>
            </div>
          );
        })}

        {treks.map((t) => {
          if (!t.position) return null;
          const { x, y } = project(t.position.lat, t.position.lng);
          return (
            <div key={t.trekId} className="group absolute z-20 -translate-x-1/2 -translate-y-1/2" style={{ left: x, top: y }}>
              <button
                type="button"
                aria-label={`${t.trekkerName}, ${t.position.altM !== null ? formatAltitude(t.position.altM) : "altitude unknown"}`}
                className="flex size-4 cursor-default items-center justify-center rounded-full border-2 border-accent bg-bg"
              >
                <span className="size-1.5 rounded-full bg-accent" />
              </button>
              <Tip>
                <p className="font-medium">{t.trekkerName}</p>
                <p className="font-mono text-accent">{t.position.altM !== null ? formatAltitude(t.position.altM) : "Altitude unknown"}</p>
              </Tip>
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
              aria-label={`SOS from ${e.trekkerName}${selected ? ", selected" : ""}`}
              className="absolute z-30 flex min-h-12 min-w-12 -translate-x-1/2 -translate-y-1/2 cursor-pointer flex-col items-center justify-center"
              style={{ left: x, top: y }}
            >
              <span
                className={cn(
                  "flex size-8 items-center justify-center rounded-full bg-sos text-ink",
                  selected ? "ring-4 ring-text" : e.status === "open" && "ring-4 ring-sos/40"
                )}
              >
                <AlertTriangle className="size-4" aria-hidden />
              </span>
              <span className={cn("mt-1 whitespace-nowrap rounded-[var(--radius-sm)] border px-1.5 font-mono text-small", selected ? "border-text bg-sos text-ink" : "border-sos/60 bg-bg text-sos")}>
                {e.trekkerName}
                {e.altM !== null && ` · ${formatAltitude(e.altM)}`}
              </span>
            </button>
          );
        })}
      </div>

      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap items-center gap-4 rounded-[var(--radius)] border border-line-strong bg-surface-3 px-3 py-1.5 text-small text-text-muted">
        <span className="flex items-center gap-1.5">
          <AlertTriangle className="size-3.5 text-sos" aria-hidden /> SOS
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-full border-2 border-accent" /> Trekker
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-ok" /> Clinic / HRA
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-[2px] bg-accent" /> Helipad
        </span>
      </div>
    </div>
  );
}
