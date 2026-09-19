"use client"

import React, { useCallback, useEffect, useState } from "react"
import { Compass, AlertTriangle, LifeBuoy, Phone, X, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { listFleet, listSos, type FleetTrekker, type SosWithContext } from "@/lib/db/queries"
import { formatAltitude, formatNepalTime } from "@/lib/format"
import { RED_FLAG_LABELS } from "@/lib/ams-copy"
import { EmptyState } from "@/components/ui/empty-state"
import { RescueMap } from "./RescueMap"
import { CATEGORY_LABELS, routeName } from "./SosQueue"
import { cn } from "cn"

const POLL_MS = 10_000
const DAY_MS = 86_400_000
const nepalDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" })
const dayOf = (startedAt: string | null, today: string) =>
  startedAt ? Math.round((Date.parse(today) - Date.parse(nepalDay.format(new Date(startedAt)))) / DAY_MS) + 1 : null

interface AgencyConsoleProps {
  initialFleet: FleetTrekker[]
  initialSos: SosWithContext[]
  initialError: string | null
  agencyName: string
}

/** Read-only fleet view for an agency admin (C-10). Everything comes from the database. */
export function AgencyConsole({ initialFleet, initialSos, initialError, agencyName }: AgencyConsoleProps) {
  const [fleet, setFleet] = useState(initialFleet)
  const [sos, setSos] = useState(initialSos)
  const [error, setError] = useState(initialError)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const sb = createClient()
    try {
      const [nextFleet, nextSos] = await Promise.all([listFleet(sb), listSos(sb, { unresolvedOnly: true })])
      setFleet(nextFleet)
      setSos(nextSos)
      setError(null)
    } catch {
      setError("Live data unavailable. Retrying…")
    }
  }, [])

  useEffect(() => {
    const sb = createClient()
    const channel = sb
      .channel("agency-console")
      .on("postgres_changes", { event: "*", schema: "public", table: "sos_events" }, refresh)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "alerts" }, refresh)
      .subscribe()
    const poll = setInterval(refresh, POLL_MS)
    return () => {
      clearInterval(poll)
      sb.removeChannel(channel)
    }
  }, [refresh])

  const sosByTrek = new Map(sos.filter((s) => s.trekId).map((s) => [s.trekId!, s]))
  const selected = fleet.find((t) => t.trekId === selectedId) ?? null
  const today = nepalDay.format(new Date())

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-bg text-text">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border bg-surface/60 px-6 backdrop-blur">
        <div className="flex items-center gap-3">
          <Compass className="h-5 w-5 text-accent" />
          <h1 className="text-sm font-bold tracking-tight">
            {agencyName} <span className="font-normal text-text-muted">· {fleet.length} on trail</span>
          </h1>
        </div>
        <span className="rounded-[var(--radius-sm)] border border-border bg-surface-2 px-2.5 py-1 text-xs text-text-muted">
          Read-only view
        </span>
      </header>

      {error && (
        <p role="alert" className="border-b border-danger/40 bg-danger/10 px-6 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-12">
        <div className="flex h-full flex-col overflow-hidden border-r border-border lg:col-span-7">
          {fleet.length === 0 ? (
            <EmptyState
              className="m-6"
              icon={<Users className="h-6 w-6 text-text-muted" />}
              title="No active treks"
              description="Trekkers linked to your agency appear here once they start a trek."
            />
          ) : (
            <div className="flex-1 overflow-y-auto">
              <table className="w-full border-collapse text-left text-xs">
                <thead className="sticky top-0 border-b border-border bg-surface font-medium text-text-muted">
                  <tr>
                    <th className="px-4 py-2.5">Trekker</th>
                    <th className="px-3 py-2.5">Route</th>
                    <th className="px-3 py-2.5">Day</th>
                    <th className="px-3 py-2.5">Altitude</th>
                    <th className="px-3 py-2.5 text-center">Last LLS</th>
                    <th className="px-3 py-2.5 text-center">Open alerts</th>
                    <th className="px-3 py-2.5 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {fleet.map((t) => {
                    const openSos = sosByTrek.get(t.trekId)
                    return (
                      <tr
                        key={t.trekId}
                        tabIndex={0}
                        onClick={() => setSelectedId(t.trekId)}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedId(t.trekId)}
                        className={cn(
                          "cursor-pointer transition-colors hover:bg-surface-2/60 focus-visible:outline-2 focus-visible:outline-accent",
                          selectedId === t.trekId && "bg-surface-2",
                          openSos && "bg-sos/10",
                        )}
                      >
                        <td className="px-4 py-3 font-semibold">{t.trekkerName}</td>
                        <td className="px-3 py-3 text-text-muted">{routeName(t.routeId)}</td>
                        <td className="px-3 py-3 font-mono tabular-nums">{dayOf(t.startedAt, today) ?? "—"}</td>
                        <td className="px-3 py-3 font-mono font-semibold tabular-nums">
                          {t.position?.altM != null ? formatAltitude(t.position.altM) : "—"}
                        </td>
                        <td className="px-3 py-3 text-center font-mono tabular-nums">{t.lastCheckin?.lls ?? "—"}</td>
                        <td className="px-3 py-3 text-center">
                          {t.openAlerts > 0 ? (
                            <span className="inline-flex items-center gap-1 rounded bg-caution/20 px-1.5 py-0.5 font-mono font-bold text-caution">
                              <AlertTriangle className="h-3 w-3" />
                              {t.openAlerts}
                            </span>
                          ) : (
                            <span className="font-mono text-text-muted">0</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-right">
                          {openSos ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-sos px-2 py-0.5 text-[10px] font-bold text-sos-ink">
                              <LifeBuoy className="h-3 w-3" />
                              SOS {openSos.status === "acknowledged" ? "ACK" : "OPEN"}
                            </span>
                          ) : (
                            <span className="rounded-full bg-ok/20 px-2 py-0.5 text-[10px] font-semibold text-ok">ON TRAIL</span>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="relative flex h-full flex-col lg:col-span-5">
          <RescueMap
            events={sos}
            treks={fleet}
            selectedId={selected ? (sosByTrek.get(selected.trekId)?.id ?? null) : null}
            onSelect={(sosId) => setSelectedId(sos.find((s) => s.id === sosId)?.trekId ?? null)}
          />
        </div>
      </div>

      {selected && (
        <aside
          aria-label={`${selected.trekkerName} details`}
          className="fixed inset-y-0 right-0 z-50 flex w-full flex-col space-y-4 overflow-y-auto border-l border-border bg-surface p-5 shadow-2xl sm:w-96"
        >
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div>
              <h2 className="text-base font-bold">{selected.trekkerName}</h2>
              <p className="text-xs text-text-muted">
                {routeName(selected.routeId)} · Day {dayOf(selected.startedAt, today) ?? "—"}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close"
              onClick={() => setSelectedId(null)}
              className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:bg-surface-2"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {sosByTrek.get(selected.trekId) && (
            <div className="space-y-1 rounded-[var(--radius-sm)] bg-sos p-3 text-sos-ink">
              <p className="flex items-center gap-2 text-xs font-bold">
                <LifeBuoy className="h-4 w-4" /> SOS {sosByTrek.get(selected.trekId)!.status}
              </p>
              <p className="text-[11px]">
                {CATEGORY_LABELS[sosByTrek.get(selected.trekId)!.category]} · sent{" "}
                {formatNepalTime(sosByTrek.get(selected.trekId)!.createdAt)} NPT. Coordination handles the response.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2/60 p-3">
              <span className="block text-[10px] font-semibold uppercase text-text-muted">Altitude</span>
              <span className="font-mono text-base font-bold tabular-nums">
                {selected.position?.altM != null ? formatAltitude(selected.position.altM) : "—"}
              </span>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border bg-surface-2/60 p-3">
              <span className="block text-[10px] font-semibold uppercase text-text-muted">Last position</span>
              <span className="font-mono text-base font-bold tabular-nums">
                {selected.position ? `${formatNepalTime(selected.position.recordedAt)} NPT` : "—"}
              </span>
            </div>
          </div>

          <div className="space-y-1 rounded-[var(--radius-sm)] border border-border bg-surface-2/60 p-3 text-xs">
            <span className="block text-[10px] font-semibold uppercase text-text-muted">Last check-in</span>
            {selected.lastCheckin ? (
              <>
                <p className="font-mono font-bold">
                  LLS {selected.lastCheckin.lls}/12 · {formatNepalTime(selected.lastCheckin.recordedAt)} NPT
                </p>
                {selected.lastCheckin.redFlags.length > 0 && (
                  <p className="font-semibold text-danger">
                    {selected.lastCheckin.redFlags.map((f) => RED_FLAG_LABELS[f]).join(" · ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-text-muted">No check-ins yet.</p>
            )}
          </div>

          {selected.emergencyContact && (
            <div className="space-y-2 rounded-[var(--radius-sm)] border border-border bg-surface-2/60 p-3 text-xs">
              <span className="block text-[10px] font-semibold uppercase text-text-muted">Emergency contact</span>
              <div className="flex items-center justify-between">
                <span className="font-medium">{selected.emergencyContact.name || "Emergency contact"}</span>
                <a href={`tel:${selected.emergencyContact.phone}`} className="flex items-center gap-1 font-mono text-accent hover:underline">
                  <Phone className="h-3.5 w-3.5" />
                  {selected.emergencyContact.phone}
                </a>
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}
