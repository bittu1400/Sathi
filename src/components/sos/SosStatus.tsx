"use client"

import * as React from "react"
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { latestSosStore } from "@/lib/session"
import type { SosEvent, SosStatus as Status } from "@/lib/types"
import { formatNepalTime } from "@/lib/format"
import { SOS_DISCLAIMER } from "@/lib/ams-copy"
import { cn } from "cn"
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

  const acknowledged = sos.status !== "open"
  const resolved = sos.status === "resolved"

  return (
    <div className="mx-auto max-w-md space-y-6 p-6 text-text">
      <div className="space-y-2 text-center">
        <div className="mb-1 inline-flex rounded-full bg-sos/15 p-3 text-sos">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <p className="text-2xl font-bold tracking-tight">{resolved ? "SOS resolved" : "SOS sent"}</p>
        <p className="font-mono text-xs text-text-muted">Ref {sos.id.replace(/-/g, "").slice(0, 4).toUpperCase()}</p>
      </div>

      <ol className="space-y-4 rounded-[var(--radius)] border border-border bg-surface-2 p-4" aria-live="polite">
        <Step done title="Sent to coordination" detail={`${formatNepalTime(sos.createdAt)} NPT`} />
        <Step
          done={acknowledged}
          title={acknowledged ? "Acknowledged by HRA Coordination (demo)" : "Waiting for acknowledgment"}
          detail={sos.acknowledgedAt ? `${formatNepalTime(sos.acknowledgedAt)} NPT` : undefined}
        />
        {resolved && (
          <Step done title="Resolved" detail={sos.resolvedAt ? `${formatNepalTime(sos.resolvedAt)} NPT` : undefined} />
        )}
      </ol>

      <p className="text-center text-xs italic text-text-muted">{SOS_DISCLAIMER}</p>

      {!resolved && <ResolveSosForm onResolve={onResolve} />}
    </div>
  )
}

function Step({ done, title, detail }: { done: boolean; title: string; detail?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className={cn("mt-0.5 rounded-full p-1", done ? "bg-ok/15 text-ok" : "bg-caution/15 text-caution")}>
        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
      </span>
      <span className="space-y-0.5">
        <span className="block text-sm font-semibold">{title}</span>
        {detail && <span className="block font-mono text-xs text-text-muted">{detail}</span>}
      </span>
    </li>
  )
}
