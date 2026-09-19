"use client"

import { useSyncExternalStore } from "react"

/**
 * A JSON value in localStorage that React can read without hydration
 * mismatches (server snapshot is always null) and that updates every
 * subscriber, in this tab and others, when it changes.
 */
export function createLocalStore<T>(key: string) {
  const event = `sathi:${key}`
  let cachedRaw: string | null | undefined
  let cachedValue: T | null = null

  function get(): T | null {
    if (typeof window === "undefined") return null
    let raw: string | null = null
    try {
      raw = localStorage.getItem(key)
    } catch {
      return cachedValue
    }
    if (raw !== cachedRaw) {
      cachedRaw = raw
      try {
        cachedValue = raw ? (JSON.parse(raw) as T) : null
      } catch {
        cachedValue = null
      }
    }
    return cachedValue
  }

  function set(value: T | null) {
    try {
      if (value === null) localStorage.removeItem(key)
      else localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // storage full or blocked: keep the in-memory copy
      cachedRaw = undefined
      cachedValue = value
    }
    window.dispatchEvent(new Event(event))
  }

  function subscribe(onChange: () => void) {
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) onChange()
    }
    window.addEventListener(event, onChange)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(event, onChange)
      window.removeEventListener("storage", onStorage)
    }
  }

  function useValue(): T | null {
    return useSyncExternalStore(subscribe, get, () => null)
  }

  return { get, set, subscribe, useValue }
}
