"use client";

import dynamic from "next/dynamic";
import { MapPinOff } from "lucide-react";
import { Skeleton } from "../ui/skeleton";
import type { MapProps } from "./MapInner";

// Offline and the map code was never cached: show this instead of crashing the page.
function MapUnavailable() {
  return (
    <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 rounded-[var(--radius-lg)] border border-line bg-surface lg:aspect-auto lg:h-[420px] p-4 text-center">
      <MapPinOff className="h-6 w-6 text-text-muted" />
      <p className="text-body font-medium text-text">Map not available offline yet</p>
      <p className="max-w-xs text-small text-text-muted">Open this page once with signal and the map will work offline next time.</p>
    </div>
  );
}

const MapInner = dynamic(() => import("./MapInner").catch(() => MapUnavailable), {
  ssr: false,
  loading: () => <Skeleton className="aspect-[4/3] w-full lg:aspect-auto lg:h-[420px]" />,
});

export function Map(props: MapProps) {
  return <MapInner {...props} />;
}
