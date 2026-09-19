import React from "react"
import { requireRole } from "@/lib/auth"
import { createClient } from "@/lib/supabase/server"
import { AgencyConsole, type AgencyTrekker } from "@/components/rescue/AgencyConsole"
import type { ExtendedSosEvent } from "@/components/rescue/SosQueue"

export const dynamic = "force-dynamic"

interface SosDbRow {
  id: string
  trek_id: string | null
  user_id: string
  lat: number | null
  lng: number | null
  alt_m: number | null
  accuracy_m: number | null
  category: "altitude_illness" | "injury" | "lost" | "weather" | "other"
  note: string | null
  last_checkin_lls: number | null
  created_at: string
  received_at: string | null
  channel: "online" | "queued" | "sms"
  status: "open" | "acknowledged" | "resolved"
  acknowledged_by: string | null
  trek?: { route_id: string; started_at: string | null } | null
  profile?: {
    display_name: string
    emergency_contact_name: string | null
    emergency_contact_phone: string | null
  } | null
}

export default async function AgencyPage() {
  await requireRole("agency_admin", "/agency")
  const supabase = await createClient()

  // 1. Fetch open SOS events
  const { data: sosRows } = await supabase
    .from("sos_events")
    .select(
      `
      id,
      trek_id,
      user_id,
      lat,
      lng,
      alt_m,
      accuracy_m,
      category,
      note,
      last_checkin_lls,
      created_at,
      received_at,
      channel,
      status,
      acknowledged_by,
      trek:treks!sos_events_trek_id_fkey(route_id, started_at),
      profile:profiles!sos_events_user_id_fkey(display_name, emergency_contact_name, emergency_contact_phone)
    `
    )
    .neq("status", "resolved")
    .order("created_at", { ascending: false })

  const typedSosRows = (sosRows || []) as unknown as SosDbRow[]

  const sosEvents: ExtendedSosEvent[] = typedSosRows.map((row) => ({
    id: row.id,
    trekId: row.trek_id,
    userId: row.user_id,
    lat: row.lat,
    lng: row.lng,
    altM: row.alt_m,
    accuracyM: row.accuracy_m,
    category: row.category,
    note: row.note,
    lastCheckinLls: row.last_checkin_lls,
    createdAt: row.created_at,
    receivedAt: row.received_at,
    channel: row.channel,
    status: row.status,
    acknowledgedBy: row.acknowledged_by,
    acknowledgedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
    trekkerName: row.profile?.display_name || "Trekker",
    routeId: row.trek?.route_id || "ebc",
    emergencyContact: row.profile?.emergency_contact_name
      ? {
          name: row.profile.emergency_contact_name,
          phone: row.profile.emergency_contact_phone || "",
        }
      : null,
  }))

  const hasMayaSos = sosEvents.some(
    (e) => (e.trekkerName?.toLowerCase() || "").includes("maya") && e.status !== "resolved"
  )

  // 2. Compose fleet data: Maya + 3 agency demo trekkers
  const fleetTrekkers: AgencyTrekker[] = [
    {
      id: "demo-trekker-maya",
      name: "Maya Shrestha",
      route: "Everest Base Camp",
      routeId: "ebc",
      dayNumber: 7,
      altitudeM: 4940,
      dailyGainM: 530,
      lastLls: 7,
      activeAlertsCount: 1,
      sosActive: hasMayaSos,
      sosCategory: "altitude_illness",
      lat: 27.9483,
      lng: 86.8125,
      emergencyContact: {
        name: "Ramesh Shrestha (Brother)",
        phone: "+9779841234567",
      },
    },
    {
      id: "demo-trekker-tenzing",
      name: "Tenzing Norgay",
      route: "Everest Base Camp",
      routeId: "ebc",
      dayNumber: 5,
      altitudeM: 3860,
      dailyGainM: 420,
      lastLls: 1,
      activeAlertsCount: 0,
      sosActive: false,
      lat: 27.8358,
      lng: 86.764,
      emergencyContact: {
        name: "Dawa Sherpa",
        phone: "+9779812345678",
      },
    },
    {
      id: "demo-trekker-sarah",
      name: "Sarah Jenkins",
      route: "Annapurna Circuit",
      routeId: "annapurna-circuit",
      dayNumber: 3,
      altitudeM: 2670,
      dailyGainM: 510,
      lastLls: 0,
      activeAlertsCount: 0,
      sosActive: false,
      lat: 27.85,
      lng: 86.72,
      emergencyContact: {
        name: "David Jenkins (Father)",
        phone: "+447911123456",
      },
    },
    {
      id: "demo-trekker-liam",
      name: "Liam Ross",
      route: "Everest Base Camp",
      routeId: "ebc",
      dayNumber: 4,
      altitudeM: 3440,
      dailyGainM: 0,
      lastLls: 2,
      activeAlertsCount: 0,
      sosActive: false,
      lat: 27.8069,
      lng: 86.714,
      emergencyContact: {
        name: "Emma Ross",
        phone: "+61412345678",
      },
    },
  ]

  return (
    <main className="h-screen w-screen flex flex-col bg-background text-foreground overflow-hidden">
      <AgencyConsole
        initialTrekkers={fleetTrekkers}
        initialSosEvents={sosEvents}
        agencyName="Summit Treks (demo)"
      />
    </main>
  )
}
