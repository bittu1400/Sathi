"use client";

import React, { useEffect, useState } from "react";
import type { SosEvent, SosStatus } from "@/lib/types";
import { formatAltitude } from "@/lib/format";
import { AlertTriangle, Clock, Radio, CheckCircle2 } from "lucide-react";

export interface ExtendedSosEvent extends SosEvent {
  trekkerName?: string;
  routeName?: string;
}

interface SosQueueProps {
  events: ExtendedSosEvent[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

function formatTimeSince(dateString: string, currentTimestamp: number): string {
  if (!currentTimestamp) return "just now";
  const seconds = Math.floor(
    (currentTimestamp - new Date(dateString).getTime()) / 1000
  );
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const CATEGORY_LABELS: Record<string, string> = {
  altitude_illness: "Altitude Illness",
  injury: "Physical Injury",
  lost: "Lost / Route Off-track",
  weather: "Severe Weather",
  other: "Emergency SOS",
};

export function SosQueue({ events, selectedId, onSelect }: SosQueueProps) {
  const [filter, setFilter] = useState<"all" | "open" | "acknowledged">("open");
  const [now, setNow] = useState<number>(() =>
    typeof window !== "undefined" ? Date.now() : 0
  );

  // Live timer tick every 3s
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 3000);
    return () => clearInterval(timer);
  }, []);

  // Filter & sort: Open first, then Acknowledged, then Resolved; newest first
  const filteredEvents = events
    .filter((e) => {
      if (filter === "open") return e.status === "open";
      if (filter === "acknowledged") return e.status === "acknowledged";
      return true;
    })
    .sort((a, b) => {
      const rank = (status: SosStatus) => {
        if (status === "open") return 0;
        if (status === "acknowledged") return 1;
        return 2;
      };
      const rankDiff = rank(a.status) - rank(b.status);
      if (rankDiff !== 0) return rankDiff;
      return (
        new Date(b.receivedAt || b.createdAt).getTime() -
        new Date(a.receivedAt || a.createdAt).getTime()
      );
    });

  const openCount = events.filter((e) => e.status === "open").length;
  const ackCount = events.filter((e) => e.status === "acknowledged").length;

  return (
    <div className="flex h-full flex-col bg-background/95 border-r border-border">
      {/* Header & Tabs */}
      <div className="p-3 border-b border-border space-y-2.5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Radio className="h-4 w-4 text-orange-500 animate-pulse" />
            SOS Incident Queue
          </h2>
          <span className="text-xs font-mono text-muted-foreground">
            {events.length} total
          </span>
        </div>

        {/* Filter pill tabs */}
        <div className="flex rounded-lg bg-muted/40 p-1 text-xs font-medium">
          <button
            onClick={() => setFilter("open")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === "open"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Open</span>
            {openCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-500/20 text-red-400 font-mono text-[10px] flex items-center justify-center">
                {openCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("acknowledged")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1 rounded-md transition-all cursor-pointer ${
              filter === "acknowledged"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <span>Ack</span>
            {ackCount > 0 && (
              <span className="h-4 min-w-[16px] px-1 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[10px] flex items-center justify-center">
                {ackCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`flex-1 py-1 rounded-md transition-all cursor-pointer ${
              filter === "all"
                ? "bg-background text-foreground shadow-sm font-semibold"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            All
          </button>
        </div>
      </div>

      {/* Queue items */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/40">
        {filteredEvents.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground text-xs space-y-2">
            <CheckCircle2 className="h-8 w-8 mx-auto text-muted-foreground/40" />
            <p className="font-medium text-foreground">No incidents in this view</p>
            <p className="text-[11px]">All distress signals are monitored 24/7.</p>
          </div>
        ) : (
          filteredEvents.map((event) => {
            const isSelected = event.id === selectedId;
            const isOpen = event.status === "open";
            const isAck = event.status === "acknowledged";

            return (
              <button
                key={event.id}
                onClick={() => onSelect(event.id)}
                className={`w-full text-left p-3.5 transition-all relative block cursor-pointer ${
                  isSelected
                    ? "bg-muted/60 border-l-4 border-l-orange-500"
                    : "hover:bg-muted/30 border-l-4 border-l-transparent"
                }`}
              >
                {/* Top row: Status & Channel & Time */}
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-1.5">
                    {isOpen ? (
                      <span className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-400 uppercase tracking-wider animate-pulse">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        Open
                      </span>
                    ) : isAck ? (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/20 text-amber-400 uppercase tracking-wider">
                        Acknowledged
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 uppercase tracking-wider">
                        Resolved
                      </span>
                    )}

                    {/* Channel badge */}
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        event.channel === "sms"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
                          : event.channel === "queued"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                          : "bg-sky-500/10 text-sky-400 border border-sky-500/30"
                      }`}
                    >
                      {event.channel.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    <span>{formatTimeSince(event.createdAt, now)}</span>
                  </div>
                </div>

                {/* Category headline */}
                <div className="font-semibold text-sm text-foreground mb-1 flex items-center justify-between">
                  <span>
                    {CATEGORY_LABELS[event.category] || "Emergency SOS"}
                  </span>
                  {event.altM && (
                    <span className="font-mono text-xs text-muted-foreground">
                      {formatAltitude(event.altM)}
                    </span>
                  )}
                </div>

                {/* Trekker and Route Info */}
                <div className="text-xs text-muted-foreground flex items-center justify-between">
                  <span className="font-medium text-foreground/80">
                    {event.trekkerName || "Solo Trekker"}
                  </span>
                  <span className="text-[11px] truncate max-w-[140px]">
                    {event.routeName || "Khumbu Trail"}
                  </span>
                </div>

                {/* Note preview if present */}
                {event.note && (
                  <p className="mt-2 text-xs text-muted-foreground/90 italic bg-background/50 p-1.5 rounded border border-border/40 truncate">
                    &quot;{event.note}&quot;
                  </p>
                )}

                {/* Last Check-in / LLS info */}
                {event.lastCheckinLls !== null && event.lastCheckinLls !== undefined && (
                  <div className="mt-1.5 text-[11px] font-mono text-amber-400/90 flex items-center gap-1">
                    <AlertTriangle className="h-3 w-3" />
                    <span>Lake Louise Score: {event.lastCheckinLls}</span>
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
