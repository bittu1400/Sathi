"use client"

import * as React from "react"
import { CheckCircle2, Clock, Copy, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { latestSosStore } from "@/lib/session"
import type { SosEvent, SosStatus as Status } from "@/lib/types"
import { formatCoords, formatNepalTime } from "@/lib/format"
import { SOS_DISCLAIMER } from "@/lib/ams-copy"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { ResolveSosForm } from "./ResolveSosForm"

interface Row {
  status: Status
  acknowledged_at: string | null
  acknowledged_by: string | null
  resolved_at: string | null
}

/** Status view: sent → acknowledged → resolved, live from the sos_events row. */
export function SosStatus({ sos, onResolve }: { sos: SosEvent; onResolve: (note: string) => Promise<void> }) {
  React.useEffect(() => {
    const supabase = createClient()
    const apply = (row: Row) => {
      const current = latestSosStore.get()
      if (current?.id !== sos.id) return
      latestSosStore.set({
        ...current,
        status: row.status,
        acknowledgedAt: row.acknowledged_at,
        acknowledgedBy: row.acknowledged_by,
        resolvedAt: row.resolved_at,
      })
    }
    // Catch up on anything that changed while this view was closed, then listen.
    supabase
      .from("sos_events")
      .select("status, acknowledged_at, acknowledged_by, resolved_at")
      .eq("id", sos.id)
      .maybeSingle<Row>()
      .then(({ data }) => data && apply(data))
    const channel = supabase
      .channel(`sos-${sos.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "sos_events", filter: `id=eq.${sos.id}` },
        (payload) => apply(payload.new as Row)
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [sos.id])

  // The coordinator's name, when this account is allowed to read it. "(demo)" only in demo mode.
  const [ackName, setAckName] = React.useState<string | null>(null)
  React.useEffect(() => {
    if (!sos.acknowledgedBy) return
    createClient()
      .from("profiles")
      .select("display_name")
      .eq("id", sos.acknowledgedBy)
      .maybeSingle<{ display_name: string }>()
      .then(({ data }) => setAckName(data?.display_name ?? null))
  }, [sos.acknowledgedBy])
  const demo = process.env.NEXT_PUBLIC_DEMO === "1"
  const ackTitle = `Acknowledged by ${ackName ?? "coordination"}${demo ? " (demo)" : ""}`

  const copyCoords = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast.success("Coordinates copied")
    } catch {
      toast.error("Couldn't copy. Read the coordinates out instead.")
    }
  }

  const acknowledged = sos.status !== "open"
  const resolved = sos.status === "resolved"

  return (
    <div className="mx-auto max-w-md space-y-5 p-6 text-text">
      <div className="space-y-2 text-center">
        <ShieldAlert className="mx-auto size-10 text-sos" strokeWidth={1.75} aria-hidden />
        <p className="text-h1">{resolved ? "SOS resolved" : "SOS sent"}</p>
        <p className="font-mono text-small text-text-muted">Ref {sos.id.replace(/-/g, "").slice(0, 4).toUpperCase()}</p>
      </div>

      <ol className="space-y-4 rounded-[var(--radius)] border border-line bg-surface-2 p-4" aria-live="polite">
        <Step done title="Sent to coordination" detail={`${formatNepalTime(sos.createdAt)} NPT`} />
        <Step
          done={acknowledged}
          title={acknowledged ? ackTitle : "Waiting for acknowledgment"}
          detail={sos.acknowledgedAt ? `${formatNepalTime(sos.acknowledgedAt)} NPT` : undefined}
        />
        {resolved && (
          <Step done title="Resolved" detail={sos.resolvedAt ? `${formatNepalTime(sos.resolvedAt)} NPT` : undefined} />
        )}
      </ol>

      {sos.lat !== null && sos.lng !== null && (
        <div className="flex items-center justify-between gap-3 rounded-[var(--radius)] border border-line bg-surface-2 p-3">
          <div>
            <p className="text-label text-text-muted">Position sent</p>
            <p className="font-mono text-body tabular-nums">{formatCoords(sos.lat, sos.lng)}</p>
          </div>
          <Button variant="ghost" size="icon" aria-label="Copy coordinates" onClick={() => copyCoords(formatCoords(sos.lat!, sos.lng!))}>
            <Copy className="size-4" aria-hidden />
          </Button>
        </div>
      )}

      <p className="text-center text-small text-text-muted">{SOS_DISCLAIMER}</p>

      {!resolved && <ResolveSosForm onResolve={onResolve} />}
    </div>
  )
}

function Step({ done, title, detail }: { done: boolean; title: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5", done ? "text-ok" : "text-caution")}>
        {done ? <CheckCircle2 className="size-5" aria-hidden /> : <Clock className="size-5" aria-hidden />}
      </span>
      <span className="space-y-0.5">
        <span className="block text-body font-medium">{title}</span>
        {detail && <span className="block font-mono text-small text-text-muted">{detail}</span>}
      </span>
    </li>
  )
}
