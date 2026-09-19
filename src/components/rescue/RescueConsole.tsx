"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Checkin, Position, SosStatus } from "@/lib/types";
import { SosQueue, type ExtendedSosEvent } from "@/components/rescue/SosQueue";
import { IncidentDrawer } from "@/components/rescue/IncidentDrawer";
import { RescueMap } from "@/components/rescue/RescueMap";
import { KpiBar } from "@/components/rescue/KpiBar";
import { playSosChime } from "@/components/rescue/chime";
import {
  ShieldAlert,
  Volume2,
  VolumeX,
  Clock,
  RefreshCw,
  UserCheck,
} from "lucide-react";
import Link from "next/link";

export interface ActiveTrekLocation {
  trekId: string;
  trekkerName: string;
  routeId: string;
  position: Position;
}

interface SosEventRow {
  id: string;
  trek_id: string | null;
  user_id: string;
  lat: number | null;
  lng: number | null;
  alt_m: number | null;
  accuracy_m: number | null;
  category: "altitude_illness" | "injury" | "lost" | "weather" | "other";
  note: string | null;
  last_checkin_lls: number | null;
  created_at: string;
  received_at: string | null;
  channel: "online" | "queued" | "sms";
  status: SosStatus;
  acknowledged_by: string | null;
  trek?: { route_id: string; started_at: string | null } | null;
  profile?: {
    display_name: string;
    emergency_contact_name: string | null;
    emergency_contact_phone: string | null;
  } | null;
}

interface TrekRow {
  id: string;
  route_id: string;
  user_id: string;
  profile?: { display_name: string } | null;
}

interface CheckinRow {
  id: string;
  trek_id: string;
  recorded_at: string;
  headache: 0 | 1 | 2 | 3;
  gi: 0 | 1 | 2 | 3;
  fatigue: 0 | 1 | 2 | 3;
  dizziness: 0 | 1 | 2 | 3;
  red_flags: ("confusion" | "ataxia" | "breathless_at_rest" | "wet_cough" | "severe_headache_unrelieved")[] | null;
  sleep_waypoint_id: string | null;
  sleep_alt_m: number | null;
  lls: number;
}

interface RescueConsoleProps {
  initialEvents: ExtendedSosEvent[];
  initialActiveTreks: ActiveTrekLocation[];
  initialTrekkersAbove4000m: number;
  initialAlerts24hCount: number;
  coordinatorId: string;
}

export function RescueConsole({
  initialEvents,
  initialActiveTreks,
  initialTrekkersAbove4000m,
  initialAlerts24hCount,
  coordinatorId,
}: RescueConsoleProps) {
  const [events, setEvents] = useState<ExtendedSosEvent[]>(initialEvents);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const firstOpen = initialEvents.find((e) => e.status === "open");
    return firstOpen ? firstOpen.id : initialEvents[0]?.id || null;
  });
  const [activeTreks, setActiveTreks] =
    useState<ActiveTrekLocation[]>(initialActiveTreks);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<{
    name: string;
    phone: string;
  } | null>(null);
  const [trekkersAbove4000m, setTrekkersAbove4000m] = useState<number>(
    initialTrekkersAbove4000m
  );
  const [alerts24hCount, setAlerts24hCount] = useState<number>(
    initialAlerts24hCount
  );
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("sathi_rescue_chime") === "1";
  });
  const [nptTime, setNptTime] = useState<string>("");
  const [isRefreshing, setIsRefreshing] = useState(false);

  const prevEventIdsRef = useRef<Set<string>>(
    new Set(initialEvents.map((e) => e.id))
  );

  // 1. Live Nepal Time Clock (Asia/Kathmandu, UTC+5:45)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const formatted = new Intl.DateTimeFormat("en-GB", {
        timeZone: "Asia/Kathmandu",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(now);
      setNptTime(`${formatted} NPT`);
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. Fetch fresh data on realtime signal or poll
  const refreshData = useCallback(async () => {
    const supabase = createClient();

    try {
      const { data: sosData } = await supabase
        .from("sos_events")
        .select(
          `
          *,
          trek:treks(route_id, started_at),
          profile:profiles(display_name, emergency_contact_name, emergency_contact_phone)
        `
        )
        .order("received_at", { ascending: false });

      if (sosData) {
        const rows = sosData as unknown as SosEventRow[];
        const mapped: ExtendedSosEvent[] = rows.map((s) => ({
          id: s.id,
          trekId: s.trek_id,
          userId: s.user_id,
          lat: s.lat,
          lng: s.lng,
          altM: s.alt_m,
          accuracyM: s.accuracy_m,
          category: s.category,
          note: s.note,
          lastCheckinLls: s.last_checkin_lls,
          createdAt: s.created_at,
          receivedAt: s.received_at,
          channel: s.channel,
          status: s.status,
          acknowledgedBy: s.acknowledged_by,
    acknowledgedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
          trekkerName: s.profile?.display_name || "Trekker",
          routeName: s.trek?.route_id || "Khumbu Route",
        }));

        // Trigger audio chime for newly arriving open SOS
        for (const ev of mapped) {
          if (
            ev.status === "open" &&
            !prevEventIdsRef.current.has(ev.id) &&
            prevEventIdsRef.current.size > 0
          ) {
            playSosChime(chimeEnabled);
          }
        }
        prevEventIdsRef.current = new Set(mapped.map((m) => m.id));

        setEvents(mapped);
      }

      // Query active treks
      const { data: treksData } = await supabase
        .from("treks")
        .select("id, route_id, user_id, profile:profiles(display_name)")
        .eq("status", "active");

      if (treksData) {
        const tRows = treksData as unknown as TrekRow[];
        const trekLocations: ActiveTrekLocation[] = [];
        let highAltCount = 0;

        for (const t of tRows) {
          const { data: posData } = await supabase
            .from("positions")
            .select("*")
            .eq("trek_id", t.id)
            .order("recorded_at", { ascending: false })
            .limit(1)
            .single();

          if (posData) {
            if ((posData.alt_m ?? 0) >= 4000) {
              highAltCount++;
            }
            trekLocations.push({
              trekId: t.id,
              routeId: t.route_id,
              trekkerName: t.profile?.display_name || "Trekker",
              position: {
                id: posData.id,
                trekId: posData.trek_id,
                lat: posData.lat,
                lng: posData.lng,
                altM: posData.alt_m,
                accuracyM: posData.accuracy_m,
                recordedAt: posData.recorded_at,
                source: posData.source,
              },
            });
          }
        }
        setActiveTreks(trekLocations);
        setTrekkersAbove4000m(highAltCount);
      }

      // Query alerts
      const oneDayAgo = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: alertsCount } = await supabase
        .from("alerts")
        .select("*", { count: "exact", head: true })
        .gte("created_at", oneDayAgo);

      setAlerts24hCount(alertsCount ?? 0);
    } catch {
      // Graceful fallback
    }
  }, [chimeEnabled]);

  // 3. Polling fallback every 5s per SPEC §9.2
  useEffect(() => {
    const pollTimer = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(pollTimer);
  }, [refreshData]);

  // 4. Supabase Realtime subscription
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel("rescue-realtime-events")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_events" },
        () => {
          refreshData();
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "positions" },
        () => {
          refreshData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refreshData]);

  // 5. Load selected incident context (check-ins & contact)
  useEffect(() => {
    let cancelled = false;

    if (!selectedId) {
      return;
    }

    const selectedEvent = events.find((e) => e.id === selectedId);
    if (!selectedEvent) return;

    const supabase = createClient();

    async function loadIncidentDetails() {
      if (!selectedEvent) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("emergency_contact_name, emergency_contact_phone")
        .eq("id", selectedEvent.userId)
        .single();

      if (!cancelled && profile) {
        setEmergencyContact({
          name: profile.emergency_contact_name || "",
          phone: profile.emergency_contact_phone || "",
        });
      }

      if (selectedEvent.trekId) {
        const { data: checkinRows } = await supabase
          .from("checkins")
          .select("*")
          .eq("trek_id", selectedEvent.trekId)
          .order("recorded_at", { ascending: false })
          .limit(5);

        if (!cancelled && checkinRows) {
          const cRows = checkinRows as unknown as CheckinRow[];
          setCheckins(
            cRows.map((c) => ({
              id: c.id,
              trekId: c.trek_id,
              recordedAt: c.recorded_at,
              headache: c.headache,
              gi: c.gi,
              fatigue: c.fatigue,
              dizziness: c.dizziness,
              redFlags: c.red_flags || [],
              sleepWaypointId: c.sleep_waypoint_id,
              sleepAltM: c.sleep_alt_m,
              lls: c.lls,
            }))
          );
        }
      }
    }

    loadIncidentDetails();

    return () => {
      cancelled = true;
    };
  }, [selectedId, events]);

  // Coordinator Actions
  const handleAcknowledge = async (id: string) => {
    const supabase = createClient();
    await supabase
      .from("sos_events")
      .update({
        status: "acknowledged",
        acknowledged_at: new Date().toISOString(),
        acknowledged_by: coordinatorId || null,
      })
      .eq("id", id);

    await refreshData();
  };

  const handleResolve = async (id: string, note: string) => {
    const supabase = createClient();
    await supabase
      .from("sos_events")
      .update({
        status: "resolved",
        resolved_at: new Date().toISOString(),
        note: note,
      })
      .eq("id", id);

    await refreshData();
  };

  const toggleChime = () => {
    setChimeEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("sathi_rescue_chime", next ? "1" : "0");
      if (next) playSosChime(true);
      return next;
    });
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshData();
    setTimeout(() => setIsRefreshing(false), 400);
  };

  const selectedEvent = events.find((e) => e.id === selectedId) || null;
  const openCount = events.filter((e) => e.status === "open").length;

  return (
    <div className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      {/* 1. Global Tactical Header */}
      <header className="h-14 border-b border-border bg-background/95 backdrop-blur px-4 flex items-center justify-between gap-4 shrink-0 z-30">
        {/* Brand & System Mode */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-orange-500" />
            <span className="font-bold text-sm tracking-tight text-foreground">
              Sathi
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-muted text-muted-foreground font-mono">
              Coordination
            </span>
          </div>

          <div className="h-4 w-[1px] bg-border mx-1" />

          {/* Live Nepal Clock */}
          <div className="flex items-center gap-1.5 text-xs font-mono text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-accent" />
            <span className="font-semibold text-foreground">{nptTime}</span>
          </div>
        </div>

        {/* Center KPIs */}
        <KpiBar
          openSosCount={openCount}
          activeTreksCount={activeTreks.length}
          trekkersAbove4000m={trekkersAbove4000m}
          alerts24hCount={alerts24hCount}
        />

        {/* Right Tools & Status */}
        <div className="flex items-center gap-2">
          {/* Audio Chime Toggle */}
          <button
            onClick={toggleChime}
            className={`h-8 px-2.5 rounded-lg border text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
              chimeEnabled
                ? "bg-accent/15 border-accent text-accent"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
            title={chimeEnabled ? "Alert chime enabled" : "Alert chime muted"}
          >
            {chimeEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Chime On</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5" />
                <span className="hidden sm:inline text-[11px]">Muted</span>
              </>
            )}
          </button>

          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            className="h-8 w-8 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground cursor-pointer"
            title="Refresh now"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin text-accent" : ""}`}
            />
          </button>

          <Link
            href="/settings"
            className="h-8 px-2.5 rounded-lg border border-border hover:bg-muted text-xs font-medium flex items-center gap-1.5 text-foreground cursor-pointer"
          >
            <UserCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Settings</span>
          </Link>
        </div>
      </header>

      {/* 2. 3-Column Tactical Workspace (Queue | Tactical Map | Incident Drawer) */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: SOS Queue (380px) */}
        <section className="w-[380px] shrink-0 h-full overflow-hidden">
          <SosQueue
            events={events}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
          />
        </section>

        {/* Center Column: Interactive Rescue Map (flex-1) */}
        <main className="flex-1 h-full relative overflow-hidden">
          <RescueMap
            events={events}
            selectedId={selectedId}
            onSelect={(id) => setSelectedId(id)}
            activeTreks={activeTreks}
          />
        </main>

        {/* Right Column: Selected Incident Drawer (420px) */}
        <aside className="w-[420px] shrink-0 h-full overflow-hidden">
          <IncidentDrawer
            event={selectedEvent}
            checkins={checkins}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
            emergencyContact={emergencyContact}
          />
        </aside>
      </div>
    </div>
  );
}
