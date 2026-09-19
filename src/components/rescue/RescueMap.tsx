"use client";

import React, { useState } from "react";
import type { ExtendedSosEvent } from "./SosQueue";
import type { Position } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { getResources } from "@/lib/data";

const EMERGENCY_RESOURCES = getResources();
import { TopoBackground } from "./TopoBackground";
import {
  MapPin,
  AlertTriangle,
  Hospital,
  Layers,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

interface ActiveTrekLocation {
  trekId: string;
  trekkerName: string;
  routeId: string;
  position: Position;
}

interface RescueMapProps {
  events: ExtendedSosEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  activeTreks?: ActiveTrekLocation[];
}

export function RescueMap({
  events,
  selectedId,
  onSelect,
  activeTreks = [],
}: RescueMapProps) {
  const [showResources, setShowResources] = useState(true);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Focus region: Khumbu / Everest bounding area [27.65 -> 28.05 N, 86.65 -> 86.95 E]
  const minLat = 27.65;
  const maxLat = 28.05;
  const minLng = 86.65;
  const maxLng = 86.95;

  // Project lat/lng to percentage coordinates
  const projectCoords = (lat: number, lng: number) => {
    // x = lng, y = lat (inverted)
    const x = ((lng - minLng) / (maxLng - minLng)) * 100;
    const y = ((maxLat - lat) / (maxLat - minLat)) * 100;
    // Clamp within 5% - 95%
    return {
      x: Math.max(5, Math.min(95, x)),
      y: Math.max(5, Math.min(95, y)),
    };
  };

  const openEvents = events.filter((e) => e.status !== "resolved");

  return (
    <div className="relative h-full w-full bg-[#0d131a] overflow-hidden flex flex-col select-none">
      {/* Topographic Background Overlay */}
      <TopoBackground className="text-sky-500/20" />

      {/* Map Header Overlay */}
      <div className="absolute top-3 left-3 z-20 flex items-center gap-2 pointer-events-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border text-xs shadow-lg">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          <span className="font-semibold text-foreground">Sathi Live Tactical Grid</span>
          <span className="font-mono text-muted-foreground ml-1 text-[11px]">
            [Khumbu/Everest Sector]
          </span>
        </div>

        {/* Toggle resources */}
        <button
          onClick={() => setShowResources((r) => !r)}
          className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium backdrop-blur-md shadow flex items-center gap-1.5 transition-all cursor-pointer ${
            showResources
              ? "bg-accent/15 border-accent text-accent"
              : "bg-background/80 border-border text-muted-foreground hover:text-foreground"
          }`}
        >
          <Layers className="h-3.5 w-3.5" />
          Resources ({EMERGENCY_RESOURCES.length})
        </button>
      </div>

      {/* Controls Overlay */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.2))}
          className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-muted shadow cursor-pointer"
          title="Zoom In"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => setZoomLevel((z) => Math.max(0.8, z - 0.2))}
          className="h-8 w-8 rounded-lg bg-background/80 backdrop-blur-md border border-border flex items-center justify-center text-foreground hover:bg-muted shadow cursor-pointer"
          title="Zoom Out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
      </div>

      {/* Map Viewport Area */}
      <div
        className="relative flex-1 w-full h-full transition-transform duration-300 origin-center"
        style={{ transform: `scale(${zoomLevel})` }}
      >
        {/* Synthetic Everest Trail Vector Guide Line */}
        <svg
          className="absolute inset-0 h-full w-full pointer-events-none stroke-accent/40"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d="M 28 85 Q 35 65 42 50 T 60 30 T 70 18"
            fill="none"
            strokeWidth="0.75"
            strokeDasharray="2 2"
          />
        </svg>

        {/* 1. Emergency Resources */}
        {showResources &&
          EMERGENCY_RESOURCES.filter(
            (r) => r.lat >= minLat && r.lat <= maxLat && r.lng >= minLng && r.lng <= maxLng
          ).map((resource) => {
            const { x, y } = projectCoords(resource.lat, resource.lng);
            return (
              <div
                key={resource.id}
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 group pointer-events-auto cursor-pointer"
                style={{ left: `${x}%`, top: `${y}%` }}
              >
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center text-[10px] shadow-md border ${
                    resource.kind === "hra_post" || resource.kind === "hospital"
                      ? "bg-emerald-600/90 border-emerald-400 text-white"
                      : resource.kind === "helipad"
                      ? "bg-sky-600/90 border-sky-400 text-white font-bold"
                      : "bg-slate-700/90 border-slate-500 text-slate-200"
                  }`}
                >
                  {resource.kind === "helipad" ? (
                    "H"
                  ) : resource.kind === "hra_post" || resource.kind === "hospital" ? (
                    <Hospital className="h-3 w-3" />
                  ) : (
                    <MapPin className="h-3 w-3" />
                  )}
                </div>

                {/* Tooltip on hover */}
                <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:block z-30 whitespace-nowrap rounded-md bg-background/95 border border-border px-2 py-1 text-[11px] shadow-xl">
                  <p className="font-semibold text-foreground">{resource.name}</p>
                  <p className="text-[10px] font-mono text-muted-foreground">
                    {resource.altM ? formatAltitude(resource.altM) : ""} · {resource.region}
                  </p>
                </div>
              </div>
            );
          })}

        {/* 2. Active Trekkers */}
        {activeTreks.map((trek) => {
          const { x, y } = projectCoords(trek.position.lat, trek.position.lng);
          return (
            <div
              key={trek.trekId}
              className="absolute z-15 -translate-x-1/2 -translate-y-1/2 group pointer-events-auto cursor-pointer"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              <div className="relative flex items-center justify-center">
                <span className="h-3.5 w-3.5 rounded-full bg-cyan-500/30 border border-cyan-400 flex items-center justify-center shadow-lg">
                  <span className="h-1.5 w-1.5 rounded-full bg-cyan-300" />
                </span>
              </div>

              {/* Tooltip */}
              <div className="absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 hidden group-hover:block z-30 whitespace-nowrap rounded-md bg-background/95 border border-border px-2 py-1 text-[11px] shadow-xl">
                <p className="font-semibold text-foreground">{trek.trekkerName}</p>
                <p className="text-[10px] font-mono text-cyan-400">
                  {trek.position.altM ? formatAltitude(trek.position.altM) : "On trail"}
                </p>
              </div>
            </div>
          );
        })}

        {/* 3. Open SOS Beacons (Pulsing Orange) */}
        {openEvents.map((event) => {
          if (!event.lat || !event.lng) return null;
          const { x, y } = projectCoords(event.lat, event.lng);
          const isSelected = event.id === selectedId;

          return (
            <div
              key={event.id}
              onClick={() => onSelect(event.id)}
              className="absolute z-25 -translate-x-1/2 -translate-y-1/2 pointer-events-auto cursor-pointer group"
              style={{ left: `${x}%`, top: `${y}%` }}
            >
              {/* Pulsing ring animation */}
              <div className="relative flex items-center justify-center">
                <span className="absolute h-10 w-10 rounded-full bg-red-500/30 animate-ping opacity-75" />
                <span className="absolute h-7 w-7 rounded-full bg-orange-500/40 animate-pulse" />

                {/* Beacon pin */}
                <div
                  className={`h-7 w-7 rounded-full flex items-center justify-center shadow-2xl transition-transform ${
                    isSelected
                      ? "bg-red-600 scale-125 border-2 border-white text-white"
                      : "bg-orange-600 hover:scale-110 border border-orange-300 text-white"
                  }`}
                >
                  <AlertTriangle className="h-3.5 w-3.5 animate-bounce" />
                </div>
              </div>

              {/* Beacon Tag */}
              <div
                className={`mt-1.5 whitespace-nowrap px-2 py-0.5 rounded text-[10px] font-bold font-mono tracking-tight shadow-md border ${
                  isSelected
                    ? "bg-red-600 text-white border-white"
                    : "bg-background/90 text-orange-400 border-orange-500/50"
                }`}
              >
                SOS: {event.trekkerName || "Trekker"}
                {event.altM && ` · ${formatAltitude(event.altM)}`}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend Footer */}
      <div className="absolute bottom-3 left-3 z-20 flex items-center gap-4 px-3 py-1.5 rounded-lg bg-background/80 backdrop-blur-md border border-border text-[11px] shadow-lg pointer-events-auto text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-foreground">SOS Distress</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-cyan-400" />
          <span>Active Trekker</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-emerald-600 text-white text-[8px] flex items-center justify-center font-bold">
            +
          </span>
          <span>Clinic / Post</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded bg-sky-600 text-white text-[8px] flex items-center justify-center font-bold">
            H
          </span>
          <span>Helipad</span>
        </div>
      </div>
    </div>
  );
}
