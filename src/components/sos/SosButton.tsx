"use client"

import { Siren } from "lucide-react"
import { useSos } from "@/components/sos/SosProvider"
import { latestSosStore } from "@/lib/session"
import { cn } from "cn"

/** 72px SOS FAB, bottom-right above the tab bar (SPEC §9.1 step 1). */
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
        "fixed bottom-24 right-4 z-40 flex h-[72px] w-[72px] select-none flex-col items-center justify-center rounded-full border-4 border-sos-ink/20 bg-sos font-bold text-sos-ink shadow-2xl transition-transform hover:bg-sos/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sos/50 active:scale-95 md:bottom-6",
        className
      )}
    >
      <Siren className={cn("h-7 w-7", active && "animate-pulse motion-reduce:animate-none")} />
      <span className="mt-0.5 text-xs font-black uppercase tracking-wider">SOS</span>
    </button>
  )
}
