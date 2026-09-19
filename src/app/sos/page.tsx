"use client"

import * as React from "react"
import { ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useSos } from "@/components/sos/SosProvider"
import { SosActiveView } from "@/components/sos/SosActiveView"
import { latestSosStore } from "@/lib/session"

/** SPEC §9.1 step 6: my latest SOS from local state, works offline. */
export default function SosPage() {
  const sos = latestSosStore.useValue()
  const { open } = useSos()
  const active = sos && sos.status !== "resolved" ? sos : null

  return (
    <div className="mx-auto max-w-lg space-y-6 py-4">
      <h1 className="text-xl font-bold text-text">Emergency</h1>
      {active ? (
        <div className="rounded-[var(--radius-lg)] border border-sos/40 bg-surface shadow-lg">
          <SosActiveView sos={active} />
        </div>
      ) : (
        <div className="space-y-4 rounded-[var(--radius-lg)] border border-border bg-surface p-8 text-center">
          <div className="inline-flex rounded-full bg-surface-2 p-4 text-text-muted">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-text">No active SOS</h2>
            <p className="mx-auto max-w-xs text-sm text-text-muted">
              In an emergency, send an SOS. It works without mobile data.
            </p>
          </div>
          <Button type="button" variant="sos" size="lg" onClick={() => open()} className="w-full">
            Send SOS
          </Button>
        </div>
      )}
    </div>
  )
}
