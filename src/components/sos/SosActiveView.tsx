"use client"

import * as React from "react"
import type { SosEvent } from "@/lib/types"
import { Banner } from "@/components/ui/banner"
import { SosStatus } from "./SosStatus"
import { OfflineSosPanel } from "./OfflineSosPanel"
import { resolveOwnSos } from "@/lib/sos-actions"

/** Delivered → status view; not delivered yet → offline SMS panel (SPEC §9.1 step 4). */
export function SosActiveView({ sos, onDone }: { sos: SosEvent; onDone?: () => void }) {
  const [error, setError] = React.useState<string | null>(null)

  const resolve = async (note: string) => {
    setError(null)
    try {
      await resolveOwnSos(sos, note)
      onDone?.()
    } catch {
      setError(
        "Couldn't reach the server, so your SOS is still open for coordination. Try again when you have signal, or tell them by phone or SMS."
      )
    }
  }

  return (
    <div>
      {sos.receivedAt ? <SosStatus sos={sos} onResolve={resolve} /> : <OfflineSosPanel sos={sos} onResolve={resolve} />}
      {error && <Banner severity="danger" headline="SOS not closed" reasons={[error]} className="mx-6 mb-6" />}
    </div>
  )
}
