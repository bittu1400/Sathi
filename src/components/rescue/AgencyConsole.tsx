"use client"

import React, { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { RescueMap } from "./RescueMap"
import type { ExtendedSosEvent } from "./SosQueue"
import { formatAltitude } from "@/lib/format"
import {
  Users,
  Compass,
  AlertTriangle,
  LifeBuoy,
  Shield,
  Activity,
  Phone,
  X,
} from "lucide-react"

export interface AgencyTrekker {
  id: string
  name: string
  route: string
  routeId: string
  dayNumber: number
  altitudeM: number
  dailyGainM: number
  lastLls: number | null
  activeAlertsCount: number
  sosActive: boolean
  sosCategory?: string
  lat: number
  lng: number
  emergencyContact?: { name: string; phone: string }
}

interface AgencyConsoleProps {
  initialTrekkers: AgencyTrekker[]
  initialSosEvents: ExtendedSosEvent[]
  agencyName?: string
}

export function AgencyConsole({
  initialTrekkers,
  initialSosEvents,
  agencyName = "Summit Treks (demo)",
}: AgencyConsoleProps) {
  const [trekkers, setTrekkers] = useState<AgencyTrekker[]>(initialTrekkers)
  const [sosEvents] = useState<ExtendedSosEvent[]>(initialSosEvents)
  const [selectedTrekker, setSelectedTrekker] = useState<AgencyTrekker | null>(null)

  // Realtime subscription for dynamic updates during demo
  useEffect(() => {
    const supabase = createClient()

    // 1. Subscribe to SOS events
    const sosChannel = supabase
      .channel("agency-sos-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "sos_events" },
        (payload) => {
          const sosPayload = payload.new as { status?: string; category?: string } | null
          if (sosPayload) {
            setTrekkers((prev) =>
              prev.map((t) =>
                t.name.toLowerCase().includes("maya")
                  ? { ...t, sosActive: sosPayload.status !== "resolved", sosCategory: sosPayload.category }
                  : t
              )
            )
          }
        }
      )
      .subscribe()

    // 2. Subscribe to Alerts
    const alertChannel = supabase
      .channel("agency-alerts-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts" },
        () => {
          setTrekkers((prev) =>
            prev.map((t) =>
              t.name.toLowerCase().includes("maya")
                ? { ...t, activeAlertsCount: t.activeAlertsCount + 1 }
                : t
            )
          )
        }
      )
      .subscribe()

    // 3. Listen to local demo driver changes
    const handleStorage = () => {
      // Re-read local status if demo running on same browser
      const forcedOffline = localStorage.getItem("sathiForcedOffline") === "1"
      if (!forcedOffline) {
        // Can refresh trekker state
      }
    }
    window.addEventListener("storage", handleStorage)

    return () => {
      supabase.removeChannel(sosChannel)
      supabase.removeChannel(alertChannel)
      window.removeEventListener("storage", handleStorage)
    }
  }, [])

  // Map representation of active agency trekkers
  const mapLocations = trekkers.map((t) => ({
    trekId: t.id,
    trekkerName: t.name,
    routeId: t.routeId,
    position: {
      id: t.id,
      trekId: t.id,
      lat: t.lat,
      lng: t.lng,
      altM: t.altitudeM,
      accuracyM: 10,
      recordedAt: new Date().toISOString(),
      source: "demo" as const,
    },
  }))

  const getLlsDot = (score: number | null) => {
    if (score === null) return <span className="text-muted-foreground">-</span>
    if (score <= 2) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-500" title={`LLS ${score} (Normal)`} />
    if (score <= 5) return <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500" title={`LLS ${score} (Mild AMS)`} />
    return <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" title={`LLS ${score} (Moderate/Severe AMS)`} />
  }

  return (
    <div className="flex-1 flex flex-col h-full bg-background text-foreground overflow-hidden">
      {/* Top Header */}
      <header className="h-14 border-b border-border bg-card/60 backdrop-blur px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Compass className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">
              {agencyName} <span className="text-muted-foreground font-normal">· {trekkers.length} trekkers on trail</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-muted-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-primary" />
            TAAN LICENSED AGENCY
          </span>
          <span className="px-2.5 py-1 rounded-md bg-muted border border-border text-emerald-500 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            TELEMETRY LIVE
          </span>
        </div>
      </header>

      {/* Main Split Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        {/* Left: Trekkers Table */}
        <div className="lg:col-span-7 border-r border-border flex flex-col h-full overflow-hidden bg-background">
          <div className="p-3 border-b border-border bg-muted/30 text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
            <span>Agency Fleet Status</span>
            <span>Click row for details</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-card border-b border-border text-muted-foreground font-medium">
                <tr>
                  <th className="py-2.5 px-4">Trekker</th>
                  <th className="py-2.5 px-3">Route</th>
                  <th className="py-2.5 px-3">Day</th>
                  <th className="py-2.5 px-3">Altitude</th>
                  <th className="py-2.5 px-3">Gain</th>
                  <th className="py-2.5 px-3 text-center">LLS</th>
                  <th className="py-2.5 px-3 text-center">Alerts</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {trekkers.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => setSelectedTrekker(t)}
                    className={`cursor-pointer transition-colors hover:bg-muted/40 ${
                      selectedTrekker?.id === t.id ? "bg-muted/60" : ""
                    } ${t.sosActive ? "bg-red-500/10 hover:bg-red-500/20" : ""}`}
                  >
                    <td className="py-3 px-4 font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-muted-foreground" />
                      <span>{t.name}</span>
                    </td>
                    <td className="py-3 px-3 text-muted-foreground">{t.route}</td>
                    <td className="py-3 px-3 font-mono font-medium">Day {t.dayNumber}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-foreground">
                      {formatAltitude(t.altitudeM)}
                    </td>
                    <td className="py-3 px-3 font-mono text-muted-foreground">
                      {t.dailyGainM > 0 ? `+${t.dailyGainM} m` : `${t.dailyGainM} m`}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {getLlsDot(t.lastLls)}
                        <span className="font-mono">{t.lastLls ?? "-"}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-center">
                      {t.activeAlertsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-500 font-bold font-mono">
                          <AlertTriangle className="w-3 h-3" />
                          {t.activeAlertsCount}
                        </span>
                      ) : (
                        <span className="text-muted-foreground font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {t.sosActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white font-bold text-[10px] animate-pulse">
                          <LifeBuoy className="w-3 h-3" />
                          SOS ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-semibold">
                          ON TRAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Tactical Fleet Map */}
        <div className="lg:col-span-5 flex flex-col h-full border-l border-border relative bg-muted/10">
          <RescueMap
            events={sosEvents}
            selectedId={selectedTrekker?.id || null}
            onSelect={(id) => {
              const matched = trekkers.find((t) => t.id === id)
              if (matched) setSelectedTrekker(matched)
            }}
            activeTreks={mapLocations}
          />
        </div>
      </div>

      {/* Trekker Detail Drawer Modal */}
      {selectedTrekker && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col p-5 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h2 className="text-base font-bold">{selectedTrekker.name}</h2>
              <p className="text-xs text-muted-foreground">{selectedTrekker.route} · Day {selectedTrekker.dayNumber}</p>
            </div>
            <button
              onClick={() => setSelectedTrekker(null)}
              className="p-1 rounded-md text-muted-foreground hover:bg-muted"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Status Alert if SOS */}
          {selectedTrekker.sosActive && (
            <div className="p-3 rounded-lg bg-red-600 text-white space-y-1">
              <div className="flex items-center gap-2 font-bold text-xs">
                <LifeBuoy className="w-4 h-4" />
                <span>DISTRESS SIGNAL IN PROGRESS</span>
              </div>
              <p className="text-[11px] text-red-100">
                Rescue coordination has been notified. Category: {selectedTrekker.sosCategory || "Altitude Illness"}.
              </p>
            </div>
          )}

          {/* Key Metrics */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">Current Altitude</span>
              <span className="text-base font-bold font-mono text-foreground">
                {formatAltitude(selectedTrekker.altitudeM)}
              </span>
            </div>

            <div className="p-3 rounded-lg bg-muted/40 border border-border">
              <span className="text-muted-foreground block text-[10px] uppercase font-semibold">24h Ascent Gain</span>
              <span className="text-base font-bold font-mono text-foreground">
                +{selectedTrekker.dailyGainM} m
              </span>
            </div>
          </div>

          {/* Lake Louise Status */}
          <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-muted-foreground uppercase text-[10px]">Lake Louise Score</span>
              <span className="font-mono font-bold">{selectedTrekker.lastLls ?? "None"} / 12</span>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {selectedTrekker.lastLls && selectedTrekker.lastLls >= 6
                ? "Moderate symptoms reported. Advised to cease ascent and rest at current elevation."
                : "Symptoms within normal baseline thresholds."}
            </p>
          </div>

          {/* Emergency Contact */}
          {selectedTrekker.emergencyContact && (
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-2 text-xs">
              <span className="font-semibold text-muted-foreground uppercase text-[10px] block">
                Emergency Contact
              </span>
              <div className="flex items-center justify-between">
                <span className="font-medium text-foreground">{selectedTrekker.emergencyContact.name}</span>
                <a
                  href={`tel:${selectedTrekker.emergencyContact.phone}`}
                  className="flex items-center gap-1 text-primary hover:underline font-mono"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {selectedTrekker.emergencyContact.phone}
                </a>
              </div>
            </div>
          )}

          <div className="pt-2">
            <p className="text-[10px] text-muted-foreground italic">
              Agency view is read-only. For coordination intervention, use the official Coordinator workspace.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
