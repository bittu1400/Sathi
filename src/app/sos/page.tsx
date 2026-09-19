"use client"

import * as React from "react"
import Link from "next/link"
import { ShieldAlert, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SosEvent } from "@/lib/types"
import { SosStatus } from "@/components/sos/SosStatus"
import { OfflineSosPanel } from "@/components/sos/OfflineSosPanel"
import { useSos } from "@/components/sos/SosProvider"

function getStoredSos(): SosEvent | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem("sathiLatestSos")
    return saved ? (JSON.parse(saved) as SosEvent) : null
  } catch {
    return null
  }
}

export default function SosPage() {
  const [sos, setSos] = React.useState<SosEvent | null>(getStoredSos)
  const { open } = useSos()

  const handleResolve = () => {
    if (sos) {
      const updated = { ...sos, status: "resolved" as const }
      setSos(updated)
      localStorage.setItem("sathiLatestSos", JSON.stringify(updated))
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground py-8 px-4 max-w-lg mx-auto space-y-6">
      <div className="flex items-center justify-between pb-2 border-b border-border">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Home
        </Link>
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Emergency Center
        </span>
      </div>

      {!sos || sos.status === "resolved" ? (
        <div className="p-8 text-center bg-card border border-border rounded-2xl space-y-4 shadow-sm">
          <div className="inline-flex p-4 rounded-full bg-muted text-muted-foreground">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold">No Active Emergency</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto">
              You do not have an active SOS beacon broadcast. In an emergency, trigger a new beacon immediately.
            </p>
          </div>

          <div className="pt-4">
            <Button
              type="button"
              onClick={() => open()}
              className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 h-12 rounded-xl text-sm uppercase tracking-wide"
            >
              Trigger Emergency SOS
            </Button>
          </div>
        </div>
      ) : sos.channel === "online" ? (
        <div className="bg-card border border-red-500/40 rounded-2xl p-2 shadow-lg">
          <SosStatus sos={sos} onResolve={handleResolve} />
        </div>
      ) : (
        <div className="bg-card border border-amber-500/40 rounded-2xl p-2 shadow-lg">
          <OfflineSosPanel sos={sos} onResolve={handleResolve} />
        </div>
      )}
    </main>
  )
}
