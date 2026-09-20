"use client"

import * as React from "react"
import { Loader2, X } from "lucide-react"
import { AlertDialog } from "radix-ui"
import type { SosCategory } from "@/lib/types"
import { latestSosStore } from "@/lib/session"
import { sendSos } from "@/lib/sos-actions"
import { toast } from "@/components/ui/toast"
import { SosCountdown } from "./SosCountdown"
import { SosActiveView } from "./SosActiveView"

interface SosSheetProps {
  initialCategory?: SosCategory
  onClose: () => void
}

/** SOS sheet (SPEC §9.1), always on top. Mounted only while open, so state resets on every open. */
export function SosSheet({ initialCategory = "altitude_illness", onClose }: SosSheetProps) {
  const latest = latestSosStore.useValue()
  const active = latest && latest.status !== "resolved" ? latest : null
  // An open SOS is shown instead of a new countdown, so reopening never duplicates it.
  const [phase, setPhase] = React.useState<"countdown" | "dispatching" | "view">(() => (active ? "view" : "countdown"))
  const content = React.useRef<HTMLDivElement>(null)

  const dismiss = () => {
    if (phase === "dispatching") return
    if (phase === "countdown") toast.info("SOS cancelled")
    onClose()
  }

  const handleComplete = React.useCallback(async ({ category, note }: { category: SosCategory; note: string }) => {
    setPhase("dispatching")
    try {
      await sendSos(category, note)
    } finally {
      setPhase("view")
    }
  }, [])

  return (
    <AlertDialog.Root open onOpenChange={(open) => !open && dismiss()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[var(--z-sos)] bg-[var(--scrim)]" />
        <AlertDialog.Content
          ref={content}
          // First focus: the Cancel button, so a stray Enter can't do anything else.
          onOpenAutoFocus={(e) => {
            e.preventDefault()
            content.current?.querySelector<HTMLElement>("[data-autofocus]")?.focus()
          }}
          className="fixed left-1/2 top-1/2 z-[var(--z-sos)] max-h-[92dvh] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[var(--radius-lg)] border border-sos/60 bg-surface shadow-[var(--shadow-overlay)]"
        >
          <AlertDialog.Title className="sr-only">Emergency SOS</AlertDialog.Title>
          <AlertDialog.Description className="sr-only">
            {phase === "countdown" ? "Your SOS is sent when the countdown ends. Cancel to stop it." : "Status of your SOS."}
          </AlertDialog.Description>
          {phase === "view" && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close SOS"
              className="absolute right-2 top-2 z-10 flex size-12 cursor-pointer items-center justify-center rounded-full text-text-muted hover:bg-surface-2 hover:text-text"
            >
              <X className="size-5" strokeWidth={1.75} />
            </button>
          )}

          {phase === "countdown" && <SosCountdown initialCategory={initialCategory} onCancel={dismiss} onComplete={handleComplete} />}

          {phase === "dispatching" && (
            <div className="flex min-h-[320px] flex-col items-center justify-center gap-3 p-8 text-center" aria-live="assertive">
              <Loader2 className="size-10 animate-spin text-sos motion-reduce:animate-none" />
              <p className="text-h2">Sending SOS…</p>
              <p className="text-small text-text-muted">Getting your position and contacting coordination.</p>
            </div>
          )}

          {phase === "view" && latest && (
            <div className="pt-10">
              <SosActiveView sos={latest} onDone={onClose} />
            </div>
          )}
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
