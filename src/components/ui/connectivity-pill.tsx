"use client";

import * as React from "react";
import { cn } from "cn";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export interface ConnectivityPillProps {
  status?: "online" | "offline" | "syncing";
  queuedCount?: number;
  className?: string;
}

export function ConnectivityPill({
  status = "online",
  queuedCount = 0,
  className,
}: ConnectivityPillProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border transition-colors",
        status === "online" && "bg-ok/10 text-ok border-ok/30",
        status === "offline" && "bg-warning/15 text-warning border-warning/40",
        status === "syncing" && "bg-info/15 text-info border-info/40 animate-pulse",
        className
      )}
    >
      {status === "online" && (
        <>
          <Wifi className="w-3.5 h-3.5" />
          <span>Online</span>
        </>
      )}
      {status === "offline" && (
        <>
          <WifiOff className="w-3.5 h-3.5" />
          <span>
            Offline{queuedCount > 0 ? ` · ${queuedCount} queued` : ""}
          </span>
        </>
      )}
      {status === "syncing" && (
        <>
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Syncing…</span>
        </>
      )}
    </div>
  );
}
