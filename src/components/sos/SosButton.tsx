"use client"

import * as React from "react"
import { Siren } from "lucide-react"
import { useSos } from "@/components/sos/SosProvider"

interface SosButtonProps {
  className?: string
}

export function SosButton({ className = "" }: SosButtonProps) {
  const { open } = useSos()

  return (
    <button
      type="button"
      onClick={() => open()}
      aria-label="Trigger Emergency SOS"
      className={`fixed bottom-20 right-4 z-40 w-[72px] h-[72px] rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white font-bold flex flex-col items-center justify-center shadow-2xl transition-transform border-4 border-white/20 focus:outline-none focus:ring-4 focus:ring-red-400 select-none ${className}`}
    >
      <Siren className="w-7 h-7 animate-pulse text-white" />
      <span className="text-xs font-black tracking-wider uppercase mt-0.5">SOS</span>
    </button>
  )
}
