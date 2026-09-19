"use client";

import dynamic from "next/dynamic";
import { MapPinOff } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { MapProps } from "./MapInner";
import type { RouteChoiceMapProps } from "./RouteChoiceMapInner";

// Offline and the map code was never cached: show this instead of crashing the page.
function MapUnavailable() {
  return (
    <div className="flex h-[350px] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius)] border border-border bg-surface-2 p-4 text-center">
      <MapPinOff className="h-6 w-6 text-text-muted" />
      <p className="text-sm font-semibold text-text">Map not available offline yet</p>
      <p className="max-w-xs text-xs text-text-muted">Open this page once with signal and the map will work offline next time.</p>
    </div>
  );
}

const MapInner = dynamic(() => import("./MapInner").catch(() => MapUnavailable), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full rounded-[var(--radius)]" />,
});

export function Map(props: MapProps) {
  return <MapInner {...props} />;
}

const RouteChoiceMapInner = dynamic(() => import("./RouteChoiceMapInner").catch(() => MapUnavailable), {
  ssr: false,
  loading: () => <Skeleton className="h-[420px] w-full rounded-[var(--radius)]" />,
});

export function RouteChoiceMap(props: RouteChoiceMapProps) {
  return <RouteChoiceMapInner {...props} />;
}
