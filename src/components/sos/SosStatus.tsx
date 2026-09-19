"use client"

import * as React from "react"
import { CheckCircle2, Clock, ShieldAlert } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import type { SosEvent } from "@/lib/types"
import { formatNepalTime } from "@/lib/format"

interface SosStatusProps {
  sos: SosEvent
  onResolve: (note?: string) => void
}

export function SosStatus({ sos: initialSos, onResolve }: SosStatusProps) {
  const [sos, setSos] = React.useState<SosEvent>(initialSos)
  const [resolving, setResolving] = React.useState(false)
  const [resolveNote, setResolveNote] = React.useState("")
  const [showResolvePrompt, setShowResolvePrompt] = React.useState(false)

  // Realtime subscription on sos_events row
  React.useEffect(() => {
    if (!initialSos.id) return

    const supabase = createClient()
    const channel = supabase
      .channel(`sos-${initialSos.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sos_events",
          filter: `id=eq.${initialSos.id}`,
        },
        (payload) => {
          if (payload.new) {
            setSos((prev) => ({
              ...prev,
              status: payload.new.status,
              acknowledgedBy: payload.new.acknowledged_by,
              receivedAt: payload.new.received_at,
            }))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [initialSos.id])

  const handleResolveSubmit = async () => {
    setResolving(true)
    try {
      const supabase = createClient()
      await supabase
        .from("sos_events")
        .update({
          status: "resolved",
          note: resolveNote.trim() ? `${sos.note ? sos.note + " | " : ""}Resolved: ${resolveNote}` : sos.note,
        })
        .eq("id", sos.id)

      onResolve(resolveNote)
    } finally {
      setResolving(false)
      setShowResolvePrompt(false)
    }
  }

  const isAck = sos.status === "acknowledged" || sos.status === "resolved"
  const isResolved = sos.status === "resolved"

  return (
    <div className="p-6 max-w-md mx-auto space-y-6 text-foreground">
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-full bg-red-600/10 text-red-600 mb-1">
          <ShieldAlert className="w-8 h-8 animate-bounce" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight">SOS Beacon Active</h2>
        <p className="text-xs text-muted-foreground">
          Incident ID: #{sos.id.substring(0, 8).toUpperCase()} · Sent via {sos.channel}
        </p>
      </div>

      {/* Progress Timeline */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-4">
        {/* Step 1: Dispatched */}
        <div className="flex items-start gap-3">
          <div className="mt-0.5 p-1 rounded-full bg-emerald-500/20 text-emerald-500">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">1. Dispatched to Coordination</p>
            <p className="text-xs text-muted-foreground">
              Sent at {formatNepalTime(sos.createdAt)} NPT with your live trail coordinates.
            </p>
          </div>
        </div>

        {/* Step 2: Acknowledgment */}
        <div className="flex items-start gap-3">
          <div
            className={`mt-0.5 p-1 rounded-full ${
              isAck
                ? "bg-emerald-500/20 text-emerald-500"
                : "bg-amber-500/20 text-amber-500"
            }`}
          >
            {isAck ? <CheckCircle2 className="w-4 h-4" /> : <Clock className="w-4 h-4 animate-spin" />}
          </div>
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              {isAck ? "2. Acknowledged by Rescue Team" : "2. Awaiting Coordinator Response"}
            </p>
            <p className="text-xs text-muted-foreground">
              {isAck
                ? sos.acknowledgedBy
                  ? `Acknowledged by ${sos.acknowledgedBy}. Responders alerted.`
                  : "Acknowledged by coordination team. Response in progress."
                : "Live dispatchers at HRA & rescue coordination are reviewing your beacon."}
            </p>
          </div>
        </div>

        {/* Step 3: Resolved */}
        {isResolved && (
          <div className="flex items-start gap-3">
            <div className="mt-0.5 p-1 rounded-full bg-emerald-500/20 text-emerald-500">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="space-y-0.5">
              <p className="text-sm font-semibold">3. Incident Resolved</p>
              <p className="text-xs text-muted-foreground">
                Trekker marked as safe.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Safety Subline verbatim from SAFETY §1 */}
      <p className="text-xs text-muted-foreground text-center italic">
        This alerts coordination and your emergency contact. It is not a guarantee of rescue. Keep trying other means: guide, teahouse phone, other trekkers.
      </p>

      {/* Resolve Action */}
      {!isResolved && (
        <div className="pt-2">
          {!showResolvePrompt ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowResolvePrompt(true)}
              className="w-full text-xs font-semibold"
            >
              I&apos;m Safe Now (Cancel / Resolve)
            </Button>
          ) : (
            <div className="p-3 rounded-xl border border-border bg-card space-y-3">
              <p className="text-xs font-semibold">Confirm you are safe:</p>
              <input
                type="text"
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                placeholder="Optional note (e.g. reached teahouse safely)..."
                className="w-full px-3 py-1.5 text-xs border border-input rounded-md bg-background"
              />
              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowResolvePrompt(false)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  size="sm"
                  disabled={resolving}
                  onClick={handleResolveSubmit}
                >
                  {resolving ? "Resolving..." : "Confirm Safe"}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
