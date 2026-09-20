"use client"

import * as React from "react"
import { SosProvider } from "@/components/sos/SosProvider"
import { CommandPalette } from "@/components/ui/command-palette"
import { Toaster } from "@/components/ui/toast"

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SosProvider>
      {children}
      <Toaster />
      <CommandPalette />
    </SosProvider>
  )
}
