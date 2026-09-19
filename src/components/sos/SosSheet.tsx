"use client"

import * as React from "react"
import { X, Loader2 } from "lucide-react"
import type { SosCategory } from "@/lib/types"
import { latestSosStore } from "@/lib/session"
import { sendSos } from "@/lib/sos-actions"
import { SosCountdown } from "./SosCountdown"
import { SosActiveView } from "./SosActiveView"

interface SosSheetProps {
  initialCategory?: SosCategory
  onClose: () => void
}

/** Full-screen SOS sheet (SPEC §9.1). Mounted only while open, so state resets on every open. */
export function SosSheet({ initialCategory = "altitude_illness", onClose }: SosSheetProps) {
  const latest = latestSosStore.useValue()
  const active = latest && latest.status !== "resolved" ? latest : null
  // An open SOS is shown instead of a new countdown, so reopening never duplicates it.
  const [phase, setPhase] = React.useState<"countdown" | "dispatching" | "view">(() =>
    active ? "view" : "countdown"
  )

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && phase !== "dispatching") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [phase, onClose])

  const handleComplete = React.useCallback(async ({ category, note }: { category: SosCategory; note: string }) => {
    setPhase("dispatching")
    try {
      await sendSos(category, note)
    } finally {
      setPhase("view")
    }
  }, [])

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="sos-sheet-title"
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-bg/90 p-4 backdrop-blur-sm"
    >
      <div className="relative flex min-h-[460px] w-full max-w-md flex-col justify-between overflow-hidden rounded-[var(--radius-lg)] border border-sos/40 bg-surface shadow-2xl">
        <h2 id="sos-sheet-title" className="sr-only">
          Emergency SOS
        </h2>
        {phase === "view" && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close SOS"
            className="absolute right-3 top-3 z-10 flex h-12 w-12 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-surface-2 hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        )}

        {phase === "countdown" && (
          <SosCountdown initialCategory={initialCategory} onCancel={onClose} onComplete={handleComplete} />
        )}

        {phase === "dispatching" && (
          <div className="flex flex-1 flex-col items-center justify-center space-y-4 p-8 text-center" aria-live="assertive">
            <Loader2 className="h-12 w-12 animate-spin text-sos motion-reduce:animate-none" />
            <p className="text-xl font-bold text-text">Sending SOS…</p>
            <p className="text-xs text-text-muted">Getting your position and contacting coordination.</p>
          </div>
        )}

        {phase === "view" && latest && <SosActiveView sos={latest} onDone={onClose} />}
      </div>
    </div>
  )
}
