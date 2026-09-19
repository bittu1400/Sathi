"use client";

import React, { useState } from "react";
import { AlertTriangle, Clock, Radio, CheckCircle2 } from "lucide-react";
import type { SosStatus } from "@/lib/types";
import type { SosWithContext } from "@/lib/db/queries";
import { formatAltitude } from "@/lib/format";
import { getRoute } from "@/lib/data";
import { cn } from "cn";

export const CATEGORY_LABELS: Record<string, string> = {
  altitude_illness: "Altitude illness",
  injury: "Injury",
  lost: "Lost / off trail",
  weather: "Severe weather",
  other: "Other emergency",
};

export const STATUS_STYLE: Record<SosStatus, string> = {
  open: "bg-sos/20 text-sos",
  acknowledged: "bg-caution/20 text-caution",
  resolved: "bg-ok/20 text-ok",
};

const CHANNEL_STYLE = {
  online: "border-info/30 bg-info/10 text-info",
  queued: "border-caution/30 bg-caution/10 text-caution",
  sms: "border-ok/30 bg-ok/10 text-ok",
} as const;

export function timeSince(iso: string, now: number | null): string {
  if (now === null) return "";
  const seconds = Math.max(0, Math.floor((now - Date.parse(iso)) / 1000));
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return hours < 24 ? `${hours}h ago` : `${Math.floor(hours / 24)}d ago`;
}

export const routeName = (routeId: string | null) => (routeId ? (getRoute(routeId)?.name ?? routeId) : "No active trek");

const RANK: Record<SosStatus, number> = { open: 0, acknowledged: 1, resolved: 2 };
type Filter = "open" | "acknowledged" | "all";

interface SosQueueProps {
  events: SosWithContext[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number | null;
}

export function SosQueue({ events, selectedId, onSelect, now }: SosQueueProps) {
  const [filter, setFilter] = useState<Filter>("open");

  const visible = events
    .filter((e) => filter === "all" || e.status === filter)
    .sort(
      (a, b) =>
        RANK[a.status] - RANK[b.status] ||
        Date.parse(b.receivedAt ?? b.createdAt) - Date.parse(a.receivedAt ?? a.createdAt),
    );
  const counts = {
    open: events.filter((e) => e.status === "open").length,
    acknowledged: events.filter((e) => e.status === "acknowledged").length,
    all: events.length,
  };

  return (
    <div className="flex h-full flex-col border-r border-border bg-bg/95">
      <div className="space-y-2.5 border-b border-border p-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold tracking-tight">
          <Radio className="h-4 w-4 text-sos" />
          SOS queue
        </h2>
        <div role="tablist" className="flex rounded-[var(--radius-sm)] bg-surface-2/60 p-1 text-xs font-medium">
          {(["open", "acknowledged", "all"] as const).map((f) => (
            <button
              key={f}
              type="button"
              role="tab"
              aria-selected={filter === f}
              onClick={() => setFilter(f)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md py-1.5 transition-colors",
                filter === f ? "bg-bg font-semibold text-text shadow-sm" : "text-text-muted hover:text-text",
              )}
            >
              <span className="capitalize">{f === "acknowledged" ? "Ack" : f}</span>
              <span className="font-mono tabular-nums text-[10px]">{counts[f]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 divide-y divide-border/40 overflow-y-auto" aria-live="polite">
        {visible.length === 0 ? (
          <div className="space-y-2 p-8 text-center text-xs text-text-muted">
            <CheckCircle2 className="mx-auto h-8 w-8 opacity-40" />
            <p className="font-medium text-text">No incidents in this view</p>
          </div>
        ) : (
          visible.map((event) => (
            <button
              key={event.id}
              type="button"
              onClick={() => onSelect(event.id)}
              aria-current={event.id === selectedId}
              className={cn(
                "relative block w-full border-l-4 p-3.5 text-left transition-colors",
                event.id === selectedId ? "border-l-sos bg-surface-2/70" : "border-l-transparent hover:bg-surface-2/40",
              )}
            >
              <div className="mb-1.5 flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span className={cn("rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLE[event.status])}>
                    {event.status}
                  </span>
                  <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px]", CHANNEL_STYLE[event.channel])}>
                    {event.channel.toUpperCase()}
                  </span>
                </div>
                <span className="flex items-center gap-1 font-mono text-[11px] text-text-muted">
                  <Clock className="h-3 w-3" />
                  {timeSince(event.createdAt, now)}
                </span>
              </div>
              <div className="mb-1 flex items-center justify-between text-sm font-semibold">
                <span>{CATEGORY_LABELS[event.category]}</span>
                {event.altM !== null && (
                  <span className="font-mono text-xs tabular-nums text-text-muted">{formatAltitude(event.altM)}</span>
                )}
              </div>
              <div className="flex items-center justify-between text-xs text-text-muted">
                <span className="font-medium text-text/80">{event.trekkerName}</span>
                <span className="max-w-[160px] truncate text-[11px]">{routeName(event.routeId)}</span>
              </div>
              {event.note && (
                <p className="mt-2 truncate rounded border border-border/40 bg-bg/50 p-1.5 text-xs italic text-text-muted">
                  &ldquo;{event.note}&rdquo;
                </p>
              )}
              {event.lastCheckinLls !== null && (
                <p className="mt-1.5 flex items-center gap-1 font-mono text-[11px] text-caution">
                  <AlertTriangle className="h-3 w-3" />
                  Last Lake Louise score {event.lastCheckinLls}
                </p>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}
