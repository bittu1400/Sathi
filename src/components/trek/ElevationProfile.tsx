"use client";

import * as React from "react";
import { cn } from "cn";

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
}

export function ElevationProfile({
  waypoints = [],
  currentDistanceKm,
  className,
  onWaypointClick,
}: ElevationProfileProps) {
  const firstWp = waypoints[0];
  const lastWp = waypoints[waypoints.length - 1];

  if (!waypoints || waypoints.length < 2 || !firstWp || !lastWp) {
    return (
      <div className={cn("h-[140px] flex items-center justify-center bg-surface-2 rounded-[var(--radius)] text-text-muted text-sm", className)}>
        No elevation data available
      </div>
    );
  }

  const maxDist = Math.max(...waypoints.map((w) => w.distanceKm), 1);
  const minAlt = Math.min(...waypoints.map((w) => w.altitudeM), 1000);
  const maxAlt = Math.max(...waypoints.map((w) => w.altitudeM), 5500);

  const paddingX = 20;
  const paddingY = 20;
  const width = 600;
  const height = 140;

  const innerW = width - paddingX * 2;
  const innerH = height - paddingY * 2;

  const getX = (distKm: number) => paddingX + (distKm / maxDist) * innerW;
  const getY = (altM: number) =>
    height - paddingY - ((altM - minAlt) / Math.max(maxAlt - minAlt, 1)) * innerH;

  // Build SVG path
  const pointsStr = waypoints
    .map((wp) => `${getX(wp.distanceKm).toFixed(1)},${getY(wp.altitudeM).toFixed(1)}`)
    .join(" L ");

  const pathD = `M ${getX(firstWp.distanceKm)},${getY(firstWp.altitudeM)} L ${pointsStr}`;
  const areaD = `${pathD} L ${getX(lastWp.distanceKm)},${height - paddingY} L ${paddingX},${height - paddingY} Z`;

  // Guide lines at 3,000 m and 5,000 m
  const y3000 = getY(3000);
  const y5000 = getY(5000);

  return (
    <div className={cn("relative w-full bg-surface border border-border rounded-[var(--radius)] p-3 overflow-hidden", className)}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-[140px] overflow-visible"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="elevationGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Guide Line 3000m */}
        {minAlt <= 3000 && maxAlt >= 3000 && (
          <g>
            <line
              x1={paddingX}
              y1={y3000}
              x2={width - paddingX}
              y2={y3000}
              stroke="var(--caution)"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.6"
            />
            <text
              x={width - paddingX - 4}
              y={y3000 - 4}
              fill="var(--caution)"
              fontSize="10"
              fontFamily="var(--font-geist-mono)"
              textAnchor="end"
            >
              3,000 m (AMS risk)
            </text>
          </g>
        )}

        {/* Guide Line 5000m */}
        {minAlt <= 5000 && maxAlt >= 5000 && (
          <g>
            <line
              x1={paddingX}
              y1={y5000}
              x2={width - paddingX}
              y2={y5000}
              stroke="var(--danger)"
              strokeDasharray="4 4"
              strokeWidth="1"
              opacity="0.6"
            />
            <text
              x={width - paddingX - 4}
              y={y5000 - 4}
              fill="var(--danger)"
              fontSize="10"
              fontFamily="var(--font-geist-mono)"
              textAnchor="end"
            >
              5,000 m
            </text>
          </g>
        )}

        {/* Area fill */}
        <path d={areaD} fill="url(#elevationGrad)" />

        {/* Profile line */}
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth="2.5" />

        {/* Waypoint Ticks */}
        {waypoints.map((wp) => {
          const cx = getX(wp.distanceKm);
          const cy = getY(wp.altitudeM);
          return (
            <g
              key={wp.id}
              className="cursor-pointer group"
              onClick={() => onWaypointClick?.(wp)}
            >
              <circle
                cx={cx}
                cy={cy}
                r="3.5"
                fill="var(--bg)"
                stroke="var(--accent)"
                strokeWidth="2"
              />
            </g>
          );
        })}

        {/* Current Position Marker */}
        {currentDistanceKm !== undefined && (
          <g>
            <line
              x1={getX(currentDistanceKm)}
              y1={paddingY}
              x2={getX(currentDistanceKm)}
              y2={height - paddingY}
              stroke="var(--sos)"
              strokeWidth="2"
            />
            <circle
              cx={getX(currentDistanceKm)}
              cy={getY(
                waypoints.find((w) => w.distanceKm >= currentDistanceKm)?.altitudeM ||
                  minAlt
              )}
              r="5"
              fill="var(--sos)"
            />
          </g>
        )}
      </svg>
    </div>
  );
}
