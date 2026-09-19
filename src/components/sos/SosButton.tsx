"use client"

import { Siren } from "lucide-react"
import { useSos } from "@/components/sos/SosProvider"
import { latestSosStore } from "@/lib/session"
import { cn } from "@/lib/utils"

/** 72 px SOS FAB, bottom-right above the tab bar (SPEC §9.1 step 1). */
export function SosButton({ className }: { className?: string }) {
  const { open } = useSos()
  const latest = latestSosStore.useValue()
  const active = latest !== null && latest.status !== "resolved"

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label={active ? "Open active SOS" : "Send emergency SOS"}
      className={cn(
        "fixed bottom-[calc(var(--tabbar-h)+env(safe-area-inset-bottom)+1rem)] right-4 z-[var(--z-fab)] flex size-[72px] cursor-pointer select-none flex-col items-center justify-center rounded-full bg-sos text-ink transition-colors duration-[var(--dur-fast)] hover:bg-sos/90 active:bg-sos/80 lg:bottom-6",
        active && "ring-4 ring-sos/40",
        className
      )}
    >
      <Siren className="size-7" strokeWidth={1.75} aria-hidden />
      <span className="text-label">SOS</span>
    </button>
  )
}
