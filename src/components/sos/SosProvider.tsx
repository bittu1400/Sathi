"use client"

import * as React from "react"
import type { SosCategory, SosEvent } from "@/lib/types"
import { SosSheet } from "./SosSheet"

interface SosContextType {
  open: (category?: SosCategory) => void
  close: () => void
  isOpen: boolean
  latestSos: SosEvent | null
}

const SosContext = React.createContext<SosContextType | null>(null)

function getStoredSos(): SosEvent | null {
  if (typeof window === "undefined") return null
  try {
    const saved = localStorage.getItem("sathiLatestSos")
    return saved ? (JSON.parse(saved) as SosEvent) : null
  } catch {
    return null
  }
}

export function SosProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [category, setCategory] = React.useState<SosCategory>("altitude_illness")
  const [latestSos, setLatestSos] = React.useState<SosEvent | null>(getStoredSos)

  const open = React.useCallback((cat: SosCategory = "altitude_illness") => {
    setCategory(cat)
    setIsOpen(true)
    setLatestSos(getStoredSos())
  }, [])

  const close = React.useCallback(() => {
    setIsOpen(false)
  }, [])

  return (
    <SosContext.Provider value={{ open, close, isOpen, latestSos }}>
      {children}
      <SosSheet
        isOpen={isOpen}
        initialCategory={category}
        onClose={close}
      />
    </SosContext.Provider>
  )
}

export function useSos() {
  const ctx = React.useContext(SosContext)
  if (!ctx) {
    throw new Error("useSos must be used within an SosProvider")
  }
  return ctx
}
