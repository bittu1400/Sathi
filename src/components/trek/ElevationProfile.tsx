"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { formatAltitude, formatKm } from "@/lib/format";

export interface WaypointTick {
  id: string;
  name: string;
  altitudeM: number;
  distanceKm: number;
}

export interface ElevationProfileProps {
  waypoints?: WaypointTick[];
  currentDistanceKm?: number;
  className?: string;
  onWaypointClick?: (wp: WaypointTick) => void;
  /** Shown under the chart, e.g. "Profile ends at Gorak Shep". */
  note?: string;
}

const PAD = { l: 44, r: 12, t: 12, b: 12 };
const HEIGHT = 200;

export function ElevationProfile({ waypoints = [], currentDistanceKm, className, onWaypointClick, note }: ElevationProfileProps) {
  const box = React.useRef<HTMLDivElement>(null);
  const [width, setWidth] = React.useState(600);
  const [active, setActive] = React.useState<string | null>(null);

  // Uniform scaling: draw at the real pixel width instead of stretching a fixed viewBox.
  React.useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => entry && setWidth(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const first = waypoints[0];
  const last = waypoints.at(-1);
  if (waypoints.length < 2 || !first || !last) {
    return (
      <div className={cn("flex h-[200px] items-center justify-center rounded-[var(--radius-lg)] border border-line bg-surface text-text-muted", className)}>
        No elevation data available
      </div>
    );
  }

  const maxDist = Math.max(...waypoints.map((w) => w.distanceKm), 1);
  const lo = Math.min(...waypoints.map((w) => w.altitudeM)) - 150;
  const hi = Math.max(...waypoints.map((w) => w.altitudeM)) + 150;
  const x = (d: number) => PAD.l + (d / maxDist) * (width - PAD.l - PAD.r);
  const y = (a: number) => HEIGHT - PAD.b - ((a - lo) / (hi - lo)) * (HEIGHT - PAD.t - PAD.b);
  const ticks = [2000, 3000, 4000, 5000, 6000].filter((t) => t > lo && t < hi);
  const line = waypoints.map((w, i) => `${i ? "L" : "M"}${x(w.distanceKm).toFixed(1)},${y(w.altitudeM).toFixed(1)}`).join(" ");
  const area = `${line} L${x(last.distanceKm).toFixed(1)},${HEIGHT - PAD.b} L${x(first.distanceKm).toFixed(1)},${HEIGHT - PAD.b} Z`;
  const peak = waypoints.reduce((a, b) => (b.altitudeM > a.altitudeM ? b : a));
  const shown = waypoints.find((w) => w.id === active);
  const summary = `Elevation profile from ${first.name}, ${formatAltitude(first.altitudeM)}, to ${last.name}, ${formatAltitude(last.altitudeM)}. Highest point ${peak.name}, ${formatAltitude(peak.altitudeM)}.`;

  return (
    <div ref={box} className={cn("relative rounded-[var(--radius-lg)] border border-line bg-surface p-3", className)}>
      <svg role="img" aria-label={summary} width={width} height={HEIGHT} viewBox={`0 0 ${width} ${HEIGHT}`} className="block max-w-full overflow-visible">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.l} x2={width - PAD.r} y1={y(t)} y2={y(t)} className={t === 3000 ? "stroke-caution" : "stroke-line-strong"} strokeDasharray={t === 3000 ? "4 4" : undefined} strokeWidth={1} />
            <text x={PAD.l - 6} y={y(t) + 4} textAnchor="end" className="fill-text-muted font-mono" fontSize={12}>
              {t.toLocaleString("en-US")}
            </text>
          </g>
        ))}
        <path d={area} className="fill-accent/[0.12]" />
        <path d={line} fill="none" className="stroke-accent" strokeWidth={2} strokeLinejoin="round" />
        {currentDistanceKm !== undefined && <line x1={x(currentDistanceKm)} x2={x(currentDistanceKm)} y1={PAD.t} y2={HEIGHT - PAD.b} className="stroke-text" strokeWidth={1} />}
        {waypoints.map((w) => (
          <g
            key={w.id}
            role="button"
            tabIndex={0}
            aria-label={`${w.name}, ${formatAltitude(w.altitudeM)}, ${formatKm(w.distanceKm)} along the route`}
            className="cursor-pointer"
            onClick={() => {
              setActive(w.id === active ? null : w.id);
              onWaypointClick?.(w);
            }}
            onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), setActive(w.id === active ? null : w.id))}
            onFocus={() => setActive(w.id)}
            onMouseEnter={() => setActive(w.id)}
            onMouseLeave={() => setActive(null)}
          >
            {/* 24 px invisible hit area around the 8 px dot */}
            <circle cx={x(w.distanceKm)} cy={y(w.altitudeM)} r={12} fill="transparent" />
            <circle cx={x(w.distanceKm)} cy={y(w.altitudeM)} r={active === w.id ? 5 : 4} className="fill-bg stroke-accent" strokeWidth={2} />
          </g>
        ))}
      </svg>
      {shown && (
        <div
          role="status"
          className="pointer-events-none absolute top-2 rounded-[var(--radius)] border border-line-strong bg-surface-3 px-3 py-2 text-small shadow-[var(--shadow-overlay)]"
          style={{ left: Math.min(Math.max(x(shown.distanceKm) - 60, 8), width - 150) }}
        >
          <p className="font-medium text-text">{shown.name}</p>
          <p className="font-mono tabular-nums text-text-muted">
            {formatAltitude(shown.altitudeM)} · {formatKm(shown.distanceKm)}
          </p>
        </div>
      )}
      {note && <p className="mt-2 text-small text-text-muted">{note}</p>}
    </div>
  );
}
