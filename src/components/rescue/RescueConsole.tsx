"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Clock, HelpCircle, RefreshCw, Volume2, VolumeX } from "lucide-react";
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
import { SosQueue, inTab, type QueueTab } from "@/components/rescue/SosQueue";
import { IncidentDrawer, copyCoordinates } from "@/components/rescue/IncidentDrawer";
import { RescueMap } from "@/components/rescue/RescueMap";
import { KpiBar } from "@/components/rescue/KpiBar";
import { playSosChime } from "@/components/rescue/chime";
import { useMinWidth, useShortcuts } from "@/components/rescue/use-shortcuts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Kbd } from "@/components/ui/kbd";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { ConsoleHeader } from "@/components/ui/shell/console-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";

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
  coordinatorName: string;
}

export function RescueConsole({ initialEvents, initialTreks, initialAlerts24h, initialError, coordinatorId, coordinatorName }: RescueConsoleProps) {
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
  const [tab, setTab] = useState<QueueTab>("open");
  const [view, setView] = useState<"queue" | "map">("queue");
  const [panelOpen, setPanelOpen] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [flashIds, setFlashIds] = useState<Set<string>>(new Set());
  const wide = useMinWidth(1280);
  const medium = useMinWidth(1024);
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
      const fresh = nextEvents.filter((e) => e.status === "open" && !knownIds.current.has(e.id));
      if (fresh.length > 0) {
        playSosChime(chimeRef.current);
        toast.info(`New SOS from ${fresh[0]!.trekkerName}`);
        const ids = fresh.map((e) => e.id);
        setFlashIds((prev) => new Set([...prev, ...ids]));
        setTimeout(() => setFlashIds((prev) => new Set([...prev].filter((id) => !ids.includes(id)))), 2000);
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

  // "(1) SOS · Sathi Rescue" in the tab title while something is open.
  useEffect(() => {
    document.title = openCount > 0 ? `(${openCount}) SOS · Sathi Rescue` : "Sathi Rescue";
  }, [openCount]);

  const visible = inTab(events, tab);
  const move = (delta: number) => {
    if (visible.length === 0) return;
    const at = visible.findIndex((e) => e.id === selectedId);
    const next = visible[Math.min(Math.max(at + delta, 0), visible.length - 1)]!;
    setSelectedId(next.id);
    document.querySelector(`[data-incident="${next.id}"] button`)?.scrollIntoView({ block: "nearest" });
  };

  const select = (id: string) => {
    setSelectedId(id);
    setPanelOpen(true);
  };

  const acknowledge = (id: string) =>
    act(() => ackSos(createClient(), id, coordinatorId)).then(() => {
      toast.success("SOS acknowledged");
    });

  useShortcuts({
    next: () => move(1),
    prev: () => move(-1),
    open: () => selected && setPanelOpen(true),
    acknowledge: () => {
      if (selected?.status === "open") acknowledge(selected.id).catch(() => {});
    },
    resolve: () => selected && selected.status !== "resolved" && setResolveOpen(true),
    copy: () => selected && copyCoordinates(selected),
    toggleView: () => setView((v) => (v === "queue" ? "map" : "queue")),
    help: () => setHelpOpen(true),
  });

  const queue = <SosQueue events={events} tab={tab} onTab={setTab} selectedId={selectedId} onSelect={select} now={now} flashIds={flashIds} />;
  const map = <RescueMap events={events} selectedId={selectedId} onSelect={select} treks={treks} />;
  const drawer = (
    <IncidentDrawer
      key={selected?.id ?? "none"}
      event={selected}
      checkins={checkins?.sosId === selectedId ? checkins.rows : []}
      now={now}
      onAcknowledge={acknowledge}
      onResolve={(id, note) => act(() => resolveSos(createClient(), id, note))}
      resolveOpen={resolveOpen}
      onResolveOpenChange={setResolveOpen}
    />
  );

  return (
    <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg text-text">
      <ConsoleHeader product="Coordination" name={coordinatorName} role="Coordinator" live={error === null}>
        <span className="hidden items-center gap-1.5 font-mono text-small tabular-nums text-text-muted md:flex">
          <Clock className="size-4" aria-hidden />
          {now === null ? "--:--:--" : clock.format(now)} NPT
        </span>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={chimeOn}
          onClick={() => {
            chimeStore.set(!chimeOn);
            if (!chimeOn) playSosChime(true);
          }}
        >
          {chimeOn ? <Volume2 className="size-4" aria-hidden /> : <VolumeX className="size-4" aria-hidden />}
          <span className="hidden sm:inline">{chimeOn ? "Chime on" : "Chime off"}</span>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Refresh now"
          onClick={async () => {
            setRefreshing(true);
            await refresh();
            setRefreshing(false);
          }}
        >
          <RefreshCw className={`size-4 ${refreshing ? "animate-spin motion-reduce:animate-none" : ""}`} aria-hidden />
        </Button>
        <Button variant="ghost" size="sm" aria-label="Keyboard shortcuts" onClick={() => setHelpOpen(true)}>
          <HelpCircle className="size-4" aria-hidden />
        </Button>
      </ConsoleHeader>

      <KpiBar openSosCount={openCount} activeTreksCount={treks.length} trekkersAbove4000m={above4000} alerts24hCount={alerts24h} />

      {error && (
        <p role="alert" className="border-b border-danger/40 bg-danger-bg px-4 py-2 text-body text-danger">
          {error}
        </p>
      )}

      <div className="min-h-0 flex-1">
        {medium ? (
          <div className={`grid h-full ${wide ? "grid-cols-[minmax(320px,24rem)_1fr_minmax(360px,28rem)]" : "grid-cols-[minmax(320px,24rem)_1fr]"}`}>
            <section className="h-full overflow-hidden border-r border-line" aria-label="SOS queue">
              {queue}
            </section>
            <section className="h-full overflow-hidden" aria-label="Map">
              {map}
            </section>
            {wide && (
              <aside className="h-full overflow-hidden border-l border-line" aria-label="Selected incident">
                {drawer}
              </aside>
            )}
          </div>
        ) : (
          <Tabs value={view} onValueChange={(v) => setView(v as "queue" | "map")} className="flex h-full flex-col">
            <TabsList className="px-2">
              <TabsTrigger value="queue">Queue</TabsTrigger>
              <TabsTrigger value="map">Map</TabsTrigger>
            </TabsList>
            <TabsContent value="queue" className="min-h-0 flex-1">
              {queue}
            </TabsContent>
            <TabsContent value="map" className="min-h-0 flex-1">
              {map}
            </TabsContent>
          </Tabs>
        )}
      </div>

      {!wide && (
        <Sheet open={panelOpen && selected !== null} onOpenChange={setPanelOpen}>
          <SheetContent title={selected?.trekkerName ?? "Incident"} className="p-0" hideTitle>
            {drawer}
          </SheetContent>
        </Sheet>
      )}

      <Dialog open={helpOpen} onOpenChange={setHelpOpen}>
        <DialogContent title="Keyboard shortcuts">
          <dl className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2">
            {(
              [
                ["J / K", "Next / previous incident"],
                ["Enter", "Open the selected incident"],
                ["A", "Acknowledge"],
                ["R", "Resolve (asks for a note)"],
                ["C", "Copy coordinates"],
                ["M", "Switch queue and map (small screens)"],
                ["?", "This list"],
                ["Esc", "Close a panel or dialog"],
              ] as const
            ).map(([k, d]) => (
              <React.Fragment key={k}>
                <dt>
                  <Kbd>{k}</Kbd>
                </dt>
                <dd className="text-body">{d}</dd>
              </React.Fragment>
            ))}
          </dl>
        </DialogContent>
      </Dialog>
    </div>
  );
}
