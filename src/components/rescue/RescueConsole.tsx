"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ShieldAlert, Volume2, VolumeX, Clock, RefreshCw, Settings } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  ackSos,
  countRecentAlerts,
  listActiveTreksWithLatestPosition,
  listCheckins,
  listSos,
  resolveSos,
  type ActiveTrekLocation,
  type SosWithContext,
} from "@/lib/db/queries";
import type { Checkin } from "@/lib/types";
import { createLocalStore } from "@/lib/local-store";
import { useNow } from "@/lib/use-now";
import { SosQueue } from "@/components/rescue/SosQueue";
import { IncidentDrawer } from "@/components/rescue/IncidentDrawer";
import { RescueMap } from "@/components/rescue/RescueMap";
import { KpiBar } from "@/components/rescue/KpiBar";
import { playSosChime } from "@/components/rescue/chime";

const POLL_MS = 5000; // SPEC §9.2 polling fallback next to realtime
const DEBOUNCE_MS = 400;
const chimeStore = createLocalStore<boolean>("sathiRescueChime");
const clock = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

interface RescueConsoleProps {
  initialEvents: SosWithContext[];
  initialTreks: ActiveTrekLocation[];
  initialAlerts24h: number;
  initialError: string | null;
  coordinatorId: string;
}

export function RescueConsole({ initialEvents, initialTreks, initialAlerts24h, initialError, coordinatorId }: RescueConsoleProps) {
  const [events, setEvents] = useState(initialEvents);
  const [treks, setTreks] = useState(initialTreks);
  const [alerts24h, setAlerts24h] = useState(initialAlerts24h);
  const [error, setError] = useState<string | null>(initialError);
  const [selectedId, setSelectedId] = useState<string | null>(
    () => (initialEvents.find((e) => e.status === "open") ?? initialEvents[0])?.id ?? null,
  );
  // Check-ins are keyed by the SOS they were loaded for, so switching incidents never shows stale data.
  const [checkins, setCheckins] = useState<{ sosId: string; rows: Checkin[] } | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const chimeOn = chimeStore.useValue() === true;
  const now = useNow();

  const knownIds = useRef(new Set(initialEvents.map((e) => e.id)));
  const chimeRef = useRef(chimeOn);
  useEffect(() => {
    chimeRef.current = chimeOn;
  }, [chimeOn]);

  const refresh = useCallback(async () => {
    const sb = createClient();
    try {
      const [nextEvents, nextTreks, nextAlerts] = await Promise.all([
        listSos(sb),
        listActiveTreksWithLatestPosition(sb),
        countRecentAlerts(sb),
      ]);
      // Chime for every open SOS we haven't seen, including the first one on an empty queue.
      if (nextEvents.some((e) => e.status === "open" && !knownIds.current.has(e.id))) {
        playSosChime(chimeRef.current);
      }
      knownIds.current = new Set(nextEvents.map((e) => e.id));
      setEvents(nextEvents);
      setTreks(nextTreks);
      setAlerts24h(nextAlerts);
      setSelectedId((current) => current ?? nextEvents.find((e) => e.status === "open")?.id ?? null);
      setError(null);
    } catch {
      setError("Live data unavailable. Retrying…");
    }
  }, []);

  // Realtime + polling, debounced so a burst of GPS inserts triggers one refresh.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(refresh, DEBOUNCE_MS);
    };
    const sb = createClient();
    const channel = sb
      .channel("rescue-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_events" }, schedule)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "positions" }, schedule)
      .subscribe();
    const poll = setInterval(schedule, POLL_MS);
    return () => {
      if (timer) clearTimeout(timer);
      clearInterval(poll);
      sb.removeChannel(channel);
    };
  }, [refresh]);

  const selected = events.find((e) => e.id === selectedId) ?? null;
  const selectedTrekId = selected?.trekId ?? null;

  useEffect(() => {
    if (!selectedId || !selectedTrekId) return;
    let cancelled = false;
    listCheckins(createClient(), selectedTrekId)
      .then((rows) => !cancelled && setCheckins({ sosId: selectedId, rows: rows.reverse().slice(0, 5) }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [selectedId, selectedTrekId]);

  const act = async (action: () => Promise<void>) => {
    try {
      await action();
    } catch (e) {
      await refresh();
      // After the refresh, which clears the banner on a successful reload.
      setError(e instanceof Error ? `Update failed: ${e.message}` : "Update failed.");
      throw e;
    }
    await refresh();
  };

  const openCount = events.filter((e) => e.status === "open").length;
  const above4000 = treks.filter((t) => (t.position?.altM ?? 0) >= 4000).length;

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text">
      <header className="z-30 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border bg-bg/95 px-4 backdrop-blur">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-sos" />
          <span className="text-sm font-bold tracking-tight">Sathi</span>
          <span className="rounded bg-surface-2 px-2 py-0.5 font-mono text-xs text-text-muted">Coordination</span>
          <span className="mx-1 h-4 w-px bg-border" />
          <span className="flex items-center gap-1.5 font-mono text-xs">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold tabular-nums">{now === null ? "--:--:--" : clock.format(now)} NPT</span>
          </span>
        </div>

        <KpiBar
          openSosCount={openCount}
          activeTreksCount={treks.length}
          trekkersAbove4000m={above4000}
          alerts24hCount={alerts24h}
        />

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => {
              chimeStore.set(!chimeOn);
              if (!chimeOn) playSosChime(true);
            }}
            aria-pressed={chimeOn}
            className={`flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] border px-2.5 text-xs font-medium transition-colors ${
              chimeOn ? "border-accent bg-accent/15 text-accent" : "border-border text-text-muted hover:text-text"
            }`}
          >
            {chimeOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            <span className="hidden sm:inline">{chimeOn ? "Chime on" : "Chime off"}</span>
          </button>
          <button
            type="button"
            aria-label="Refresh now"
            onClick={async () => {
              setRefreshing(true);
              await refresh();
              setRefreshing(false);
            }}
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted hover:text-text"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin text-accent motion-reduce:animate-none" : ""}`} />
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted hover:text-text"
          >
            <Settings className="h-3.5 w-3.5" />
          </Link>
        </div>
      </header>

      {error && (
        <p role="alert" className="border-b border-danger/40 bg-danger/10 px-4 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex flex-1 overflow-hidden">
        <section className="h-full w-[380px] shrink-0 overflow-hidden" aria-label="SOS queue">
          <SosQueue events={events} selectedId={selectedId} onSelect={setSelectedId} now={now} />
        </section>
        <main className="relative h-full flex-1 overflow-hidden">
          <RescueMap events={events} selectedId={selectedId} onSelect={setSelectedId} treks={treks} />
        </main>
        <aside className="h-full w-[420px] shrink-0 overflow-hidden" aria-label="Selected incident">
          <IncidentDrawer
            key={selected?.id ?? "none"}
            event={selected}
            checkins={checkins?.sosId === selectedId ? checkins.rows : []}
            now={now}
            onAcknowledge={(id) => act(() => ackSos(createClient(), id, coordinatorId))}
            onResolve={(id, note) => act(() => resolveSos(createClient(), id, note))}
          />
        </aside>
      </div>
    </div>
  );
}
