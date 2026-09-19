"use client"

import * as React from "react"
import { X, Loader2 } from "lucide-react"
import type { SosEvent, SosCategory } from "@/lib/types"
import { buildSos } from "@/lib/sos"
import { enqueue, flush, subscribeOutboxStatus } from "@/lib/outbox"
import { isOnline } from "@/lib/offline/status"
import { SosCountdown } from "./SosCountdown"
import { OfflineSosPanel } from "./OfflineSosPanel"
import { SosStatus } from "./SosStatus"

export type SosSheetState = "closed" | "countdown" | "dispatching" | "status" | "offline"

interface SosSheetProps {
  isOpen: boolean
  initialCategory?: SosCategory
  onClose: () => void
}

function getStoredSos(): SosEvent | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem("sathiLatestSos")
    if (!saved) return null
    const parsed = JSON.parse(saved) as SosEvent
    return parsed.status !== "resolved" ? parsed : null
  } catch {
    return null
  }
}

export function SosSheet({
  isOpen,
  initialCategory = "altitude_illness",
  onClose,
}: SosSheetProps) {
  const [currentSos, setCurrentSos] = React.useState<SosEvent | null>(getStoredSos)

  // Compute viewState based on isOpen and current active SOS
  const [activeState, setActiveState] = React.useState<SosSheetState>("countdown")

  // Watch outbox flushes to automatically transition from offline panel to status
  React.useEffect(() => {
    const unsub = subscribeOutboxStatus(({ pending }) => {
      if (activeState === "offline" && pending === 0 && currentSos) {
        setActiveState("status")
      }
    })
    return unsub
  }, [activeState, currentSos])

  if (!isOpen) return null

  const handleCountdownCancel = () => {
    onClose()
  }

  const handleCountdownComplete = async ({
    category,
    note,
  }: {
    category: SosCategory
    note: string
  }) => {
    setActiveState("dispatching")

    // Attempt to acquire fresh GPS location with 4s timeout
    let lat: number | null = null
    let lng: number | null = null
    let altM: number | null = null
    let accuracyM: number | null = null

    if (typeof navigator !== "undefined" && navigator.geolocation) {
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 4000,
            enableHighAccuracy: false,
          })
        })
        lat = pos.coords.latitude
        lng = pos.coords.longitude
        altM = pos.coords.altitude
        accuracyM = pos.coords.accuracy
      } catch {
        // GPS failed or timed out; fall back to default or cached coordinates
      }
    }

    const sos = buildSos({
      userId: "demo-user",
      category,
      note,
      lat,
      lng,
      altM,
      accuracyM,
      channel: isOnline() ? "online" : "queued",
    })

    setCurrentSos(sos)
    localStorage.setItem("sathiLatestSos", JSON.stringify(sos))

    // Map to snake_case for DB / outbox
    const row = {
      id: sos.id,
      trek_id: sos.trekId,
      user_id: sos.userId,
      lat: sos.lat,
      lng: sos.lng,
      alt_m: sos.altM,
      accuracy_m: sos.accuracyM,
      category: sos.category,
      note: sos.note,
      last_checkin_lls: sos.lastCheckinLls,
      created_at: sos.createdAt,
      channel: sos.channel,
      status: sos.status,
    }

    await enqueue("sos_events", row)

    if (!isOnline()) {
      setActiveState("offline")
      return
    }

    // 8s network flush timeout per SPEC §9.1
    const timeoutPromise = new Promise<{ timeout: true }>((resolve) =>
      setTimeout(() => resolve({ timeout: true }), 8000)
    )

    try {
      const outcome = await Promise.race([flush(), timeoutPromise])
      if ("timeout" in outcome || outcome.failed > 0) {
        setActiveState("offline")
      } else {
        setActiveState("status")
      }
    } catch {
      setActiveState("offline")
    }
  }

  const handleResolve = (note?: string) => {
    if (currentSos) {
      const updated: SosEvent = {
        ...currentSos,
        status: "resolved",
        note: note ? `${currentSos.note || ""} | Resolved: ${note}` : currentSos.note,
      }
      setCurrentSos(updated)
      localStorage.setItem("sathiLatestSos", JSON.stringify(updated))
    }
    onClose()
  }

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto"
    >
      <div className="relative w-full max-w-md min-h-[460px] bg-card border border-red-500/40 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between">
        {/* Header close button (only in status or offline mode, not during countdown) */}
        {activeState !== "countdown" && activeState !== "dispatching" && (
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors z-10"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {activeState === "countdown" && (
          <SosCountdown
            initialCategory={initialCategory}
            onCancel={handleCountdownCancel}
            onComplete={handleCountdownComplete}
          />
        )}

        {activeState === "dispatching" && (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-red-600" />
            <h3 className="text-xl font-bold">Transmitting SOS Beacon...</h3>
            <p className="text-xs text-muted-foreground">
              Contacting coordination and verifying mobile link...
            </p>
          </div>
        )}

        {activeState === "status" && currentSos && (
          <SosStatus sos={currentSos} onResolve={handleResolve} />
        )}

        {activeState === "offline" && currentSos && (
          <OfflineSosPanel
            sos={currentSos}
            onResolve={handleResolve}
          />
        )}
      </div>
    </div>
  )
}
