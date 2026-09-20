"use client";

import React from "react";
import { Clock, Inbox } from "lucide-react";
import type { SosStatus } from "@/lib/types";
import type { SosWithContext } from "@/lib/db/queries";
import { formatAltitude } from "@/lib/format";
import { getRoute } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Status, type StatusTone } from "@/components/ui/status";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const CATEGORY_LABELS: Record<string, string> = {
  altitude_illness: "Altitude illness",
  injury: "Injury",
  lost: "Lost / off trail",
  weather: "Severe weather",
  other: "Other emergency",
};

export const STATUS_TONE: Record<SosStatus, StatusTone> = { open: "sos", acknowledged: "caution", resolved: "ok" };
const RULE: Record<SosStatus, string> = { open: "border-l-sos", acknowledged: "border-l-caution", resolved: "border-l-ok" };

/** "12s", "4m 03s", "1h 05m": a live counter for open incidents. */
export function elapsed(fromIso: string, now: number | null): string {
  if (now === null) return "";
  const s = Math.max(0, Math.floor((now - Date.parse(fromIso)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const pad = (n: number) => String(n).padStart(2, "0");
  if (h > 0) return `${h}h ${pad(m)}m`;
  if (m > 0) return `${m}m ${pad(s % 60)}s`;
  return `${s}s`;
}

export const routeName = (routeId: string | null) => (routeId ? (getRoute(routeId)?.name ?? routeId) : "No active trek");

export type QueueTab = SosStatus;
const ORDER: QueueTab[] = ["open", "acknowledged", "resolved"];

/** The queue order everything else (shortcuts, selection) shares. */
export const inTab = (events: SosWithContext[], tab: QueueTab) =>
  events
    .filter((e) => e.status === tab)
    .sort((a, b) => Date.parse(b.receivedAt ?? b.createdAt) - Date.parse(a.receivedAt ?? a.createdAt));

interface SosQueueProps {
  events: SosWithContext[];
  tab: QueueTab;
  onTab: (tab: QueueTab) => void;
  selectedId: string | null;
  onSelect: (id: string) => void;
  now: number | null;
  /** Rows to highlight for 2 s after arriving. */
  flashIds: Set<string>;
}

export function SosQueue({ events, tab, onTab, selectedId, onSelect, now, flashIds }: SosQueueProps) {
  const visible = inTab(events, tab);
  const count = (s: QueueTab) => events.filter((e) => e.status === s).length;

  return (
    <div className="flex h-full flex-col bg-bg">
      <Tabs value={tab} onValueChange={(v) => onTab(v as QueueTab)} className="border-b border-line px-2">
        <TabsList className="border-b-0">
          {ORDER.map((s) => (
            <TabsTrigger key={s} value={s} className="px-3 capitalize">
              {s} <span className="ml-1 font-mono tabular-nums">{count(s)}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <ul className="flex-1 overflow-y-auto" aria-label="SOS queue">
        {visible.length === 0 ? (
          <li className="flex flex-col items-center gap-2 p-8 text-center text-text-muted">
            <Inbox className="size-6" aria-hidden />
            <span>No {tab} incidents</span>
          </li>
        ) : (
          visible.map((event) => {
            const selected = event.id === selectedId;
            return (
              <li key={event.id} className="border-b border-line" data-incident={event.id}>
                <button
                  type="button"
                  onClick={() => onSelect(event.id)}
                  aria-current={selected || undefined}
                  className={cn(
                    "block min-h-14 w-full cursor-pointer border-l-4 px-3 py-3 text-left transition-colors duration-[var(--dur)]",
                    RULE[event.status],
                    selected ? "bg-surface-3" : flashIds.has(event.id) ? "bg-sos-bg" : "hover:bg-surface-2"
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="truncate text-body font-medium">{event.trekkerName}</span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-small tabular-nums text-text-muted">
                      <Clock className="size-3.5" aria-hidden />
                      {elapsed(event.createdAt, now)}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center justify-between gap-2 text-small text-text-muted">
                    <span className="truncate">
                      {CATEGORY_LABELS[event.category]} · {routeName(event.routeId)}
                    </span>
                    {event.altM !== null && <span className="shrink-0 font-mono tabular-nums">{formatAltitude(event.altM)}</span>}
                  </div>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <Status tone={STATUS_TONE[event.status]}>{event.status}</Status>
                    <Status>{event.channel}</Status>
                    {event.lastCheckinLls !== null && <Status tone="caution">LLS {event.lastCheckinLls}</Status>}
                  </div>
                  {event.note && <p className="mt-2 truncate text-small italic text-text-muted">&ldquo;{event.note}&rdquo;</p>}
                </button>
              </li>
            );
          })
        )}
      </ul>
    </div>
  );
}
