"use client";

import * as React from "react";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";
import { Status } from "./status";

export interface ConnectivityPillProps {
  status?: "online" | "offline" | "syncing";
  queuedCount?: number;
  className?: string;
}

export function ConnectivityPill({ status = "online", queuedCount = 0, className }: ConnectivityPillProps) {
  if (status === "offline")
    return (
      <Status tone="warning" icon={<WifiOff aria-hidden />} className={className}>
        Offline{queuedCount > 0 ? ` · ${queuedCount} queued` : ""}
      </Status>
    );
  if (status === "syncing")
    return (
      <Status tone="accent" icon={<RefreshCw className="animate-spin" aria-hidden />} className={className}>
        Syncing…
      </Status>
    );
  return (
    <Status tone="ok" icon={<Wifi aria-hidden />} className={className}>
      Online
    </Status>
  );
}
