"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { Download, Phone, Users } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { listFleet, listSos, type FleetTrekker, type SosWithContext } from "@/lib/db/queries"
import { formatAltitude, formatNepalTime } from "@/lib/format"
import { RED_FLAG_LABELS } from "@/lib/ams-copy"
import { Button } from "@/components/ui/button"
import { EmptyState } from "@/components/ui/empty-state"
import { Input, Select } from "@/components/ui/field"
import { Panel } from "@/components/ui/panel"
import { Readout } from "@/components/ui/readout"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ConsoleHeader } from "@/components/ui/shell/console-header"
import { Status, type StatusTone } from "@/components/ui/status"
import { Table, type Column } from "@/components/ui/table"
import { RescueMap } from "./RescueMap"
import { CATEGORY_LABELS, routeName } from "./SosQueue"

const POLL_MS = 10_000
const DAY_MS = 86_400_000
const nepalDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kathmandu" })
const dayOf = (startedAt: string | null, today: string) =>
  startedAt ? Math.round((Date.parse(today) - Date.parse(nepalDay.format(new Date(startedAt)))) / DAY_MS) + 1 : null

type State = "sos" | "attention" | "trail"
const STATE_LABEL: Record<State, string> = { sos: "SOS", attention: "Needs attention", trail: "On trail" }
const STATE_TONE: Record<State, StatusTone> = { sos: "sos", attention: "caution", trail: "ok" }
const STATE_RANK: Record<State, number> = { sos: 0, attention: 1, trail: 2 }

interface Row extends FleetTrekker {
  state: State
  sosLabel: string | null
  day: number | null
  alt: number | null
}

interface AgencyConsoleProps {
  initialFleet: FleetTrekker[]
  initialSos: SosWithContext[]
  initialError: string | null
  agencyName: string
  adminName: string
}

/** Read-only fleet view for an agency admin (C-10). Everything comes from the database. */
export function AgencyConsole({ initialFleet, initialSos, initialError, agencyName, adminName }: AgencyConsoleProps) {
  const [fleet, setFleet] = useState(initialFleet)
  const [sos, setSos] = useState(initialSos)
  const [error, setError] = useState(initialError)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [query, setQuery] = useState("")
  const [routeFilter, setRouteFilter] = useState("all")
  const [stateFilter, setStateFilter] = useState<"all" | State>("all")
  const [sort, setSort] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "state", dir: "asc" })

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

  const sosByTrek = useMemo(() => new Map(sos.filter((s) => s.trekId).map((s) => [s.trekId!, s])), [sos])
  const today = nepalDay.format(new Date())

  const rows: Row[] = useMemo(
    () =>
      fleet.map((t) => {
        const open = sosByTrek.get(t.trekId)
        return {
          ...t,
          state: open ? "sos" : t.openAlerts > 0 ? "attention" : "trail",
          sosLabel: open ? `SOS ${open.status === "acknowledged" ? "acknowledged" : "open"}` : null,
          day: dayOf(t.startedAt, today),
          alt: t.position?.altM ?? null,
        }
      }),
    [fleet, sosByTrek, today],
  )

  const routes = [...new Set(fleet.map((t) => t.routeId))]
  const shown = rows
    .filter((r) => (routeFilter === "all" || r.routeId === routeFilter) && (stateFilter === "all" || r.state === stateFilter) && r.trekkerName.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => {
      const av = sort.key === "state" ? STATE_RANK[a.state] : sort.key === "alt" ? (a.alt ?? -1) : sort.key === "day" ? (a.day ?? -1) : a.trekkerName.localeCompare(b.trekkerName)
      const bv = sort.key === "state" ? STATE_RANK[b.state] : sort.key === "alt" ? (b.alt ?? -1) : sort.key === "day" ? (b.day ?? -1) : 0
      return ((av < bv ? -1 : av > bv ? 1 : 0) || a.trekkerName.localeCompare(b.trekkerName)) * (sort.dir === "asc" ? 1 : -1)
    })
  const selected = rows.find((t) => t.trekId === selectedId) ?? null

  const onSort = (key: string) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" }))

  const exportCsv = () => {
    const esc = (v: string | number | null) => `"${String(v ?? "").replace(/"/g, '""')}"`
    const lines = [["Trekker", "Route", "Day", "Altitude (m)", "Last LLS", "Open alerts", "Status"].map(esc).join(",")]
    for (const r of shown) lines.push([r.trekkerName, routeName(r.routeId), r.day, r.alt, r.lastCheckin?.lls ?? null, r.openAlerts, r.sosLabel ?? STATE_LABEL[r.state]].map(esc).join(","))
    const url = URL.createObjectURL(new Blob([lines.join("\n")], { type: "text/csv" }))
    const a = document.createElement("a")
    a.href = url
    a.download = `trekkers-${today}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const columns: Column<Row>[] = [
    {
      key: "name",
      header: "Trekker",
      sortKey: "name",
      cell: (r) => (
        <button type="button" onClick={() => setSelectedId(r.trekId)} className="cursor-pointer text-left font-medium hover:text-accent">
          {r.trekkerName}
        </button>
      ),
    },
    { key: "route", header: "Route", cell: (r) => <span className="text-text-muted">{routeName(r.routeId)}</span> },
    { key: "day", header: "Day", numeric: true, sortKey: "day", cell: (r) => r.day ?? "—" },
    { key: "alt", header: "Altitude", numeric: true, sortKey: "alt", cell: (r) => (r.alt !== null ? formatAltitude(r.alt) : "—") },
    { key: "lls", header: "Last LLS", numeric: true, cell: (r) => r.lastCheckin?.lls ?? "—" },
    { key: "alerts", header: "Alerts", numeric: true, cell: (r) => r.openAlerts },
    { key: "state", header: "Status", sortKey: "state", cell: (r) => <Status tone={STATE_TONE[r.state]}>{r.sosLabel ?? STATE_LABEL[r.state]}</Status> },
  ]

  const selectedSos = selected ? sosByTrek.get(selected.trekId) : undefined

  return (
    <div className="flex min-h-dvh w-full flex-col bg-bg text-text">
      <ConsoleHeader product={agencyName} name={adminName} role="Agency admin" live={error === null}>
        <Status>Read-only</Status>
      </ConsoleHeader>

      {error && (
        <p role="alert" className="border-b border-danger/40 bg-danger-bg px-4 py-2 text-body text-danger">
          {error}
        </p>
      )}

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)]">
        <div className="min-w-0 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <Input aria-label="Search trekkers" placeholder="Search by name" className="w-full sm:w-56" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select aria-label="Route" className="w-auto" value={routeFilter} onChange={(e) => setRouteFilter(e.target.value)}>
              <option value="all">All routes</option>
              {routes.map((id) => (
                <option key={id} value={id}>
                  {routeName(id)}
                </option>
              ))}
            </Select>
            <Select aria-label="Status" className="w-auto" value={stateFilter} onChange={(e) => setStateFilter(e.target.value as "all" | State)}>
              <option value="all">All statuses</option>
              {(Object.keys(STATE_LABEL) as State[]).map((s) => (
                <option key={s} value={s}>
                  {STATE_LABEL[s]}
                </option>
              ))}
            </Select>
            <span className="ml-auto text-small text-text-muted">
              {shown.length} of {fleet.length} on trail
            </span>
            {shown.length > 0 && (
              <Button variant="secondary" size="sm" onClick={exportCsv}>
                <Download className="size-4" aria-hidden /> CSV
              </Button>
            )}
          </div>

          {fleet.length === 0 ? (
            <EmptyState icon={<Users className="size-6 text-text-muted" />} title="No trekkers linked yet" description="Trekkers linked to your agency appear here once they start a trek." />
          ) : shown.length === 0 ? (
            <EmptyState title="No trekkers match" description="Clear the search or a filter to see more." />
          ) : (
            <Table caption="Trekkers on trail" columns={columns} rows={shown} rowKey={(r) => r.trekId} sort={{ ...sort, onSort }} dense />
          )}
        </div>

        <div className="h-80 overflow-hidden rounded-[var(--radius-lg)] border border-line lg:h-auto lg:min-h-[28rem]">
          <RescueMap
            events={sos}
            treks={fleet}
            selectedId={selected ? (sosByTrek.get(selected.trekId)?.id ?? null) : null}
            onSelect={(sosId) => setSelectedId(sos.find((s) => s.id === sosId)?.trekId ?? null)}
          />
        </div>
      </div>

      <Sheet open={selected !== null} onOpenChange={(open) => !open && setSelectedId(null)}>
        {selected && (
          <SheetContent title={selected.trekkerName} description={`${routeName(selected.routeId)} · Day ${selected.day ?? "—"}`}>
            <div className="space-y-4">
              {selectedSos && (
                <Panel className="border-sos/60 bg-sos-bg">
                  <p className="text-body font-medium text-sos">SOS {selectedSos.status}</p>
                  <p className="text-small text-text-muted">
                    {CATEGORY_LABELS[selectedSos.category]} · sent {formatNepalTime(selectedSos.createdAt)} NPT. Coordination handles the response.
                  </p>
                </Panel>
              )}
              <div className="grid grid-cols-2 gap-4">
                <Readout size="md" label="Altitude" value={selected.alt !== null ? selected.alt.toLocaleString("en-US") : "—"} unit={selected.alt !== null ? "m" : undefined} />
                <Readout size="md" label="Last position" value={selected.position ? formatNepalTime(selected.position.recordedAt) : "—"} unit={selected.position ? "NPT" : undefined} />
              </div>
              <Panel title="Last check-in">
                {selected.lastCheckin ? (
                  <div className="space-y-1">
                    <p className="font-mono text-h2 tabular-nums">
                      LLS {selected.lastCheckin.lls}/12 <span className="text-small text-text-muted">{formatNepalTime(selected.lastCheckin.recordedAt)} NPT</span>
                    </p>
                    {selected.lastCheckin.redFlags.length > 0 && <p className="text-body font-medium text-danger">{selected.lastCheckin.redFlags.map((f) => RED_FLAG_LABELS[f]).join(" · ")}</p>}
                  </div>
                ) : (
                  <p className="text-text-muted">No check-ins yet.</p>
                )}
              </Panel>
              {selected.emergencyContact && (
                <Panel title="Emergency contact">
                  <div className="flex items-center justify-between gap-3">
                    <span>{selected.emergencyContact.name || "Emergency contact"}</span>
                    <Button asChild variant="secondary">
                      <a href={`tel:${selected.emergencyContact.phone}`}>
                        <Phone className="size-4" aria-hidden />
                        <span className="font-mono tabular-nums">{selected.emergencyContact.phone}</span>
                      </a>
                    </Button>
                  </div>
                </Panel>
              )}
            </div>
          </SheetContent>
        )}
      </Sheet>
    </div>
  )
}
