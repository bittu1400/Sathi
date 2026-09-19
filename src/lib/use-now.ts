"use client"

import { useSyncExternalStore } from "react"

// One shared 1 s clock. The server snapshot is null, so the first client render
// matches the server HTML and ticking timers never cause hydration errors.
let now = Date.now()
const subscribers = new Set<() => void>()
let timer: ReturnType<typeof setInterval> | null = null

function subscribe(onTick: () => void) {
  subscribers.add(onTick)
  if (!timer) {
    now = Date.now()
    timer = setInterval(() => {
      now = Date.now()
      subscribers.forEach((fn) => fn())
    }, 1000)
  }
  return () => {
    subscribers.delete(onTick)
    if (subscribers.size === 0 && timer) {
      clearInterval(timer)
      timer = null
    }
  }
}

/** Current time in ms, updated every second; null during SSR/hydration. */
export function useNow(): number | null {
  return useSyncExternalStore(
    subscribe,
    () => now,
    () => null
  )
}
