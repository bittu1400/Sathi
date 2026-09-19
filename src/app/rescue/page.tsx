import React from "react";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import {
  RescueConsole,
  type ActiveTrekLocation,
} from "@/components/rescue/RescueConsole";
import type { ExtendedSosEvent } from "@/components/rescue/SosQueue";
import type { SosStatus } from "@/lib/types";

export const dynamic = "force-dynamic";

interface SosRow {
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

async function fetchAlerts24h(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const cutoff = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const { count } = await supabase
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .gte("created_at", cutoff);
  return count ?? 0;
}

export default async function RescuePage() {
  const { user } = await requireRole("coordinator");
  const supabase = await createClient();

  // 1. Fetch initial SOS events
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

  const initialEvents: ExtendedSosEvent[] = (
    (sosData as unknown as SosRow[]) || []
  ).map((s) => ({
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

  // 2. Fetch initial active treks & latest positions
  const { data: treksData } = await supabase
    .from("treks")
    .select("id, route_id, user_id, profile:profiles(display_name)")
    .eq("status", "active");

  const initialActiveTreks: ActiveTrekLocation[] = [];
  let initialTrekkersAbove4000m = 0;

  if (treksData) {
    const tRows = treksData as unknown as TrekRow[];
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
          initialTrekkersAbove4000m++;
        }
        initialActiveTreks.push({
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
  }

  // 3. Fetch alerts in last 24h via helper
  const alertsCount = await fetchAlerts24h(supabase);

  return (
    <RescueConsole
      initialEvents={initialEvents}
      initialActiveTreks={initialActiveTreks}
      initialTrekkersAbove4000m={initialTrekkersAbove4000m}
      initialAlerts24hCount={alertsCount}
      coordinatorId={user.id}
    />
  );
}
