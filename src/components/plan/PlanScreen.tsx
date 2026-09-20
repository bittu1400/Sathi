"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Map as MapLibreMap } from "maplibre-gl";
import { ArrowRight, Crosshair, Menu, Search, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePosition } from "@/lib/plan/position";
import { DestinationSearch, type Destination } from "./DestinationSearch";

const PlanMap = dynamic(() => import("@/components/map/PlanMapInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type SheetState = "peek" | "search";

const LOCATE_LABEL: Record<string, string> = {
  idle: "Use my location",
  locating: "Finding your location…",
  ready: "Recentre on my location",
  denied: "Location permission is off",
  unavailable: "Location is unavailable",
};

export interface PlanScreenProps {
  destinations: Destination[];
}

export function PlanScreen({ destinations }: PlanScreenProps) {
  const { status, coords, locate } = usePosition();
  const [sheet, setSheet] = React.useState<SheetState>("peek");
  const [destination, setDestination] = React.useState<Destination | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);

  const onReady = React.useCallback((map: MapLibreMap) => {
    mapRef.current = map;
  }, []);

  const recentre = () => {
    locate();
    if (coords) mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 700 });
  };

  const pick = (picked: Destination) => {
    setDestination(picked);
    setSheet("peek");
    mapRef.current?.flyTo({ center: [picked.lng, picked.lat], zoom: 11, duration: 900 });
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <PlanMap position={coords} onReady={onReady} />
      </div>

      {/* Top bar: menu + the pill that opens the search. */}
      <div className="absolute inset-x-0 top-0 flex items-center gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Link
          href="/about"
          aria-label="About Sathi"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-text shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Menu className="size-5" aria-hidden />
        </Link>
        <button
          type="button"
          onClick={() => setSheet("search")}
          className="flex h-12 min-w-0 flex-1 items-center gap-3 rounded-full border border-line bg-surface px-4 text-left shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Search className="size-5 shrink-0 text-text-muted" aria-hidden />
          <span className="truncate text-body text-text-muted">
            {destination ? destination.name : "Where to?"}
          </span>
        </button>
      </div>

      {/* Right rail. */}
      <div className="absolute right-3 bottom-[calc(9rem+env(safe-area-inset-bottom))] flex flex-col gap-2">
        <button
          type="button"
          onClick={recentre}
          aria-label={LOCATE_LABEL[status]}
          title={LOCATE_LABEL[status]}
          className="flex size-12 items-center justify-center rounded-full border border-line bg-surface shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Crosshair
            className={`size-5 ${status === "ready" ? "text-accent" : "text-text-muted"} ${status === "locating" ? "animate-pulse" : ""}`}
            aria-hidden
          />
        </button>
      </div>

      {/* One bottom sheet, two heights. The map stays interactive behind it. */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[var(--radius-lg)] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl transition-[height] duration-[var(--dur-base)] motion-reduce:transition-none ${
          sheet === "search" ? "h-[70dvh]" : "h-auto"
        }`}
      >
        {sheet === "peek" ? (
          <div className="flex flex-col gap-3 p-4">
            {status === "denied" && (
              <p className="text-small text-text-muted">
                Showing Nepal. Turn location on in your browser settings to start from where you are.
              </p>
            )}
            <Button onClick={() => setSheet("search")} className="w-full">
              Go somewhere <ArrowRight className="size-5" aria-hidden />
            </Button>
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-h2 text-text">Where to?</h2>
              <button
                type="button"
                onClick={() => setSheet("peek")}
                aria-label="Close search"
                className="flex size-12 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <DestinationSearch destinations={destinations} onPick={pick} />
          </div>
        )}
      </div>
    </div>
  );
}
