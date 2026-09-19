"use client"

import * as React from "react"
import { SosProvider } from "@/components/sos/SosProvider"

export function Providers({ children }: { children: React.ReactNode }) {
  return <SosProvider>{children}</SosProvider>
}
