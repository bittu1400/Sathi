"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "../ui/skeleton";
import type { MapProps } from "./MapInner";

const MapInner = dynamic(() => import("./MapInner"), {
  ssr: false,
  loading: () => <Skeleton className="h-[350px] w-full rounded-[var(--radius)]" />,
});

export function Map(props: MapProps) {
  return <MapInner {...props} />;
}
