"use client"

import * as React from "react"
import type { SosCategory } from "@/lib/types"
import { subscribeOutboxStatus } from "@/lib/outbox"
import { isOnline } from "@/lib/offline/status"
import { refreshSession } from "@/lib/session"
import { syncSosDelivery } from "./actions"
import { SosSheet } from "./SosSheet"

interface SosContextType {
  open: (category?: SosCategory) => void
  close: () => void
  isOpen: boolean
}

const SosContext = React.createContext<SosContextType | null>(null)

export function SosProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [category, setCategory] = React.useState<SosCategory>("altitude_illness")

  // Keep the offline session fresh and notice when a queued SOS gets delivered.
  React.useEffect(() => {
    const refresh = () => {
      if (isOnline()) refreshSession().catch(() => {})
    }
    refresh()
    window.addEventListener("online", refresh)
    const unsubscribe = subscribeOutboxStatus(() => {
      syncSosDelivery().catch(() => {})
    })
    return () => {
      window.removeEventListener("online", refresh)
      unsubscribe()
    }
  }, [])

  const open = React.useCallback((cat: SosCategory = "altitude_illness") => {
    setCategory(cat)
    setIsOpen(true)
  }, [])
  const close = React.useCallback(() => setIsOpen(false), [])
  const value = React.useMemo(() => ({ open, close, isOpen }), [open, close, isOpen])

  return (
    <SosContext.Provider value={value}>
      {children}
      {isOpen && <SosSheet initialCategory={category} onClose={close} />}
    </SosContext.Provider>
  )
}

export function useSos() {
  const ctx = React.useContext(SosContext)
  if (!ctx) throw new Error("useSos must be used within an SosProvider")
  return ctx
}
