"use client"

import * as React from "react"

export function isOnline(): boolean {
  if (typeof window === "undefined") return true
  const forcedOffline = localStorage.getItem("sathiForcedOffline") === "1"
  return navigator.onLine && !forcedOffline
}

export function useConnectivity() {
  const [online, setOnline] = React.useState<boolean>(true)
  const [forcedOffline, setForcedOffline] = React.useState<boolean>(false)

  React.useEffect(() => {
    const update = () => {
      const forced = localStorage.getItem("sathiForcedOffline") === "1"
      setForcedOffline(forced)
      setOnline(navigator.onLine && !forced)
    }

    update()
    window.addEventListener("online", update)
    window.addEventListener("offline", update)
    window.addEventListener("storage", update)

    return () => {
      window.removeEventListener("online", update)
      window.removeEventListener("offline", update)
      window.removeEventListener("storage", update)
    }
  }, [])

  const toggleForcedOffline = () => {
    const next = !forcedOffline
    if (next) {
      localStorage.setItem("sathiForcedOffline", "1")
    } else {
      localStorage.removeItem("sathiForcedOffline")
    }
    setForcedOffline(next)
    setOnline(navigator.onLine && !next)
    window.dispatchEvent(new Event("storage"))
  }

  return { online, forcedOffline, toggleForcedOffline }
}
