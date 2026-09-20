"use client";

import * as React from "react";
import dynamic from "next/dynamic";
import type { Map as MapLibreMap } from "maplibre-gl";
import { ArrowRight, Circle, Crosshair, MapPin, Menu, SlidersHorizontal, Users, X } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SosButton } from "@/components/sos/SosButton";
import { usePosition, type PositionStatus } from "@/lib/plan/position";
import type { InterestId } from "@/lib/plan/interests";
import type { PlanMode, PlannedRoute, PlanResult, VariantKind } from "@/lib/plan/types";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { DestinationSearch, type Destination } from "./DestinationSearch";
import { RouteCards } from "./RouteCards";
import { TripForm } from "./TripForm";

const PlanMap = dynamic(() => import("@/components/map/PlanMapInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-full w-full rounded-none" />,
});

type SheetState = "peek" | "search" | "start" | "trip" | "results";

/** What the three cards should differ by. A day out makes its own three. */
const VARIANTS: { id: VariantKind; label: string }[] = [
  { id: "ways", label: "Different ways" },
  { id: "paces", label: "Different paces" },
  { id: "treks", label: "Known treks" },
];

const LOCATE_LABEL: Record<PositionStatus, string> = {
  idle: "Use my location",
  locating: "Finding your location…",
  ready: "Recentre on my location",
  denied: "Location permission is off",
  unavailable: "Location is unavailable",
};

/** What the trip form says about a start we do not have. */
const START_LABEL: Record<PositionStatus, string> = {
  idle: "Finding your location…",
  locating: "Finding your location…",
  ready: "Your location",
  denied: "Location permission is off",
  unavailable: "Location is unavailable",
};

export interface PlanScreenProps {
  destinations: Destination[];
  basemapKey?: string;
}

export function PlanScreen({ destinations, basemapKey }: PlanScreenProps) {
  const { status, coords, locate } = usePosition();
  const [sheet, setSheet] = React.useState<SheetState>("peek");
  const [destination, setDestination] = React.useState<Destination | null>(null);
  /** Set only when the trekker picks a start by hand, e.g. location is off. */
  const [manualStart, setManualStart] = React.useState<Destination | null>(null);
  const [days, setDays] = React.useState(3);
  const [mode, setMode] = React.useState<PlanMode>("auto");
  const [variants, setVariants] = React.useState<VariantKind>("ways");
  const [interests, setInterests] = React.useState<InterestId[]>([]);
  const [routes, setRoutes] = React.useState<PlannedRoute[]>([]);
  /** The shape the planner settled on, which decides whether the toggle shows. */
  const [result, setResult] = React.useState<PlanResult | null>(null);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const mapRef = React.useRef<MapLibreMap | null>(null);

  const onReady = React.useCallback((map: MapLibreMap) => {
    mapRef.current = map;
  }, []);

  const recentre = () => {
    locate();
    if (coords) mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 14, duration: 700 });
  };

  const startPoint = manualStart
    ? { lat: manualStart.lat, lng: manualStart.lng }
    : coords
      ? { lat: coords.lat, lng: coords.lng }
      : null;
  const startLabel = manualStart ? manualStart.name : coords ? "Your location" : START_LABEL[status];

  const pickStart = (picked: Destination) => {
    setManualStart(picked);
    setRoutes([]);
    setError(null);
    setSheet(destination ? "trip" : "search");
    mapRef.current?.flyTo({ center: [picked.lng, picked.lat], zoom: 11, duration: 900 });
  };

  /** Back to the device's position as the start, asking for it if need be. */
  const useMyLocation = () => {
    setManualStart(null);
    setRoutes([]);
    locate();
    if (coords) mapRef.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 12, duration: 700 });
    setSheet(destination ? "trip" : "search");
  };

  const pick = (picked: Destination) => {
    setDestination(picked);
    setRoutes([]);
    setError(null);
    setSheet("trip");
    mapRef.current?.flyTo({ center: [picked.lng, picked.lat], zoom: 10, duration: 900 });
  };

  const findRoutes = async (wanted: VariantKind = variants) => {
    if (!destination || !startPoint) return;
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          start: startPoint,
          end: { lat: destination.lat, lng: destination.lng },
          days,
          interests,
          mode,
          variants: wanted,
        }),
      });
      const body = (await response.json().catch(() => null)) as (PlanResult & { error?: string }) | null;
      if (!response.ok || !body?.routes) {
        setError(body?.error ?? "Couldn't reach the route service.");
        // The sheet stays on the results when a toggle came back empty, so the
        // trekker can switch back to what did work.
        setRoutes([]);
        return;
      }
      const first = body.routes[0];
      if (!first) {
        setError("No route found between those points.");
        return;
      }
      setRoutes(body.routes);
      setResult(body);
      setSelectedId(first.id);
      setSheet("results");
    } catch {
      // Offline, or the request never left the device.
      setError(
        typeof navigator !== "undefined" && !navigator.onLine
          ? "Route planning needs a connection. Your downloaded maps still work."
          : "Couldn't reach the route service.",
      );
    } finally {
      setBusy(false);
    }
  };

  const expanded = sheet === "search" || sheet === "start" || sheet === "trip";
  const selectedRoute = routes.find((route) => route.id === selectedId) ?? null;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg">
      <div className="absolute inset-0">
        <PlanMap
          position={coords}
          basemapKey={basemapKey}
          routes={routes}
          selectedRouteId={selectedId}
          stops={selectedRoute?.stops ?? []}
          onReady={onReady}
        />
      </div>

      {/* Top bar: menu, then both ends of the trip — from here, to there. */}
      <div className="absolute inset-x-0 top-0 flex items-start gap-2 p-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <Link
          href="/about"
          aria-label="About Sathi"
          className="flex size-12 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-text shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Menu className="size-5" aria-hidden />
        </Link>
        <div className="min-w-0 flex-1 divide-y divide-line overflow-hidden rounded-[var(--radius-lg)] border border-line bg-surface shadow-lg">
          <button
            type="button"
            onClick={() => setSheet("start")}
            className="flex h-12 w-full min-w-0 items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <Circle className={`size-4 shrink-0 ${startPoint ? "text-accent" : "text-text-muted"}`} aria-hidden />
            <span className="truncate text-body text-text-muted">
              <span className="text-text-muted">From </span>
              <span className={startPoint ? "text-text" : ""}>{startLabel}</span>
            </span>
          </button>
          <button
            type="button"
            onClick={() => setSheet("search")}
            className="flex h-12 w-full min-w-0 items-center gap-3 px-4 text-left focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-accent"
          >
            <MapPin className={`size-4 shrink-0 ${destination ? "text-accent" : "text-text-muted"}`} aria-hidden />
            <span className="truncate text-body text-text-muted">
              <span className="text-text-muted">To </span>
              <span className={destination ? "text-text" : ""}>{destination ? destination.name : "Where to?"}</span>
            </span>
          </button>
        </div>
      </div>

      {/* Right rail, kept clear of the sheet: at 70 dvh it used to sit under it. */}
      <div
        className={`absolute right-3 flex flex-col items-end gap-2 transition-[bottom] duration-[var(--dur-base)] motion-reduce:transition-none ${
          expanded ? "bottom-[calc(70dvh+0.75rem)]" : "bottom-[calc(9rem+env(safe-area-inset-bottom))]"
        }`}
      >
        <Link
          href="/community"
          aria-label="Community boards"
          title="Community boards"
          className="flex size-12 items-center justify-center rounded-full border border-line bg-surface shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <Users className="size-5 text-text-muted" aria-hidden />
        </Link>
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
        {/* The app-wide FAB, placed in the rail so the sheet never covers it. */}
        <SosButton className="static shadow-lg" />
      </div>

      {/* One bottom sheet, three heights. The map stays interactive behind it. */}
      <div
        className={`absolute inset-x-0 bottom-0 flex flex-col rounded-t-[var(--radius-lg)] border-t border-line bg-surface pb-[env(safe-area-inset-bottom)] shadow-2xl transition-[height] duration-[var(--dur-base)] motion-reduce:transition-none ${
          expanded ? "h-[70dvh]" : "h-auto"
        }`}
      >
        {sheet === "peek" && (
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
        )}

        {sheet === "start" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <SheetHeader title="Start from" onClose={() => setSheet(destination ? "trip" : "peek")} />
            <button
              type="button"
              onClick={useMyLocation}
              disabled={status === "unavailable"}
              className="flex min-h-12 items-center gap-3 px-1 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:opacity-40"
            >
              <Crosshair
                className={`size-5 shrink-0 ${coords ? "text-accent" : "text-text-muted"} ${status === "locating" ? "animate-pulse" : ""}`}
                aria-hidden
              />
              <span>
                <span className={`block text-body ${coords ? "text-accent" : "text-text"}`}>Your location</span>
                {!coords && <span className="block text-small text-text-muted">{LOCATE_LABEL[status]}</span>}
              </span>
            </button>
            <DestinationSearch destinations={destinations} onPick={pickStart} />
          </div>
        )}

        {sheet === "search" && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <SheetHeader title="Where to?" onClose={() => setSheet(destination ? "trip" : "peek")} />
            <DestinationSearch destinations={destinations} onPick={pick} />
          </div>
        )}

        {sheet === "trip" && destination && (
          <div className="flex min-h-0 flex-1 flex-col gap-3 p-4">
            <SheetHeader title="Your trip" onClose={() => setSheet("peek")} />
            <TripForm
              destination={destination}
              startLabel={startLabel}
              startHint={manualStart ? manualStart.detail : startPoint ? null : "Tap to pick a starting point."}
              hasStart={startPoint !== null}
              days={days}
              mode={mode}
              interests={interests}
              busy={busy}
              error={error}
              onDaysChange={setDays}
              onModeChange={setMode}
              onInterestsChange={setInterests}
              onChangeDestination={() => setSheet("search")}
              onChangeStart={() => setSheet("start")}
              // Called, not handed over: as a handler it would be given the
              // click event where the variant kind goes.
              onSubmit={() => void findRoutes()}
            />
          </div>
        )}

        {sheet === "results" && (
          <div className="flex flex-col gap-3 p-4">
            <div className="flex items-baseline justify-between gap-2">
              <h2 className="text-h2 text-text">
                {routes.length === 0 ? "No routes" : routes.length === 1 ? "1 route" : `${routes.length} routes`}
                {destination ? ` to ${destination.name}` : ""}
              </h2>
              <button
                type="button"
                onClick={() => setSheet("trip")}
                aria-label="Change days or interests"
                title="Change days or interests"
                className="flex size-12 items-center justify-center rounded-[var(--radius)] text-accent hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <SlidersHorizontal className="size-5" aria-hidden />
              </button>
            </div>
            {result?.kind !== "tour" && (
              <ChipGroup>
                {VARIANTS.map((option) => (
                  <Chip
                    key={option.id}
                    selected={variants === option.id}
                    disabled={busy}
                    className={busy ? "opacity-40" : undefined}
                    onClick={() => {
                      setVariants(option.id);
                      void findRoutes(option.id);
                    }}
                  >
                    {option.label}
                  </Chip>
                ))}
              </ChipGroup>
            )}
            {error && (
              <p role="alert" className="text-small text-danger">
                {error}
              </p>
            )}
            {routes.length > 0 && (
              <RouteCards routes={routes} selectedId={selectedId ?? ""} onSelect={setSelectedId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SheetHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h2 className="text-h2 text-text">{title}</h2>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        className="flex size-12 items-center justify-center rounded-[var(--radius)] text-text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
      >
        <X className="size-5" aria-hidden />
      </button>
    </div>
  );
}
