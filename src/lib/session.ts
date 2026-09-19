"use client"

import { createClient } from "@/lib/supabase/client"
import { createLocalStore } from "@/lib/local-store"
import { getActiveTrek, getProfile, listCheckins } from "@/lib/db/queries"
import type { Forecast, SosEvent, Trek } from "@/lib/types"

/**
 * What the trekker's device must know to act with no network:
 * who they are, their active trek, last LLS and last position.
 * Refreshed from Supabase when online, read from localStorage when not.
 */
export interface TrekSession {
  userId: string
  displayName: string
  emergencyContactName: string | null
  emergencyContactPhone: string | null
  trek: Pick<Trek, "id" | "routeId" | "startedAt" | "shareToken"> | null
  lastLls: number | null
  lastPosition: { lat: number; lng: number; altM: number | null; accuracyM: number | null; recordedAt: string } | null
}

export const sessionStore = createLocalStore<TrekSession>("sathiSession")
export const latestSosStore = createLocalStore<SosEvent>("sathiLatestSos")
/** /demo can inject a storm forecast (C-07); real devices use Open-Meteo. */
export const weatherFixtureStore = createLocalStore<Forecast>("sathiWeatherFixture")
/** Set by /demo: positions come from the scenario, so live GPS is paused. */
export const demoModeStore = createLocalStore<number>("sathiDemo")

export function updateSession(patch: Partial<TrekSession>) {
  const current = sessionStore.get()
  if (current) sessionStore.set({ ...current, ...patch })
}

/** Pull profile, active trek and last check-in. Returns null when signed out. */
export async function refreshSession(): Promise<TrekSession | null> {
  const sb = createClient()
  const {
    data: { user },
  } = await sb.auth.getUser()
  if (!user) {
    sessionStore.set(null)
    return null
  }
  const [profile, trek] = await Promise.all([getProfile(sb, user.id), getActiveTrek(sb, user.id)])
  const checkins = trek ? await listCheckins(sb, trek.id) : []
  const previous = sessionStore.get()
  const session: TrekSession = {
    userId: user.id,
    displayName: profile?.displayName ?? "Trekker",
    emergencyContactName: profile?.emergencyContactName ?? null,
    emergencyContactPhone: profile?.emergencyContactPhone ?? null,
    trek: trek
      ? { id: trek.id, routeId: trek.routeId, startedAt: trek.startedAt, shareToken: trek.shareToken }
      : null,
    lastLls: checkins.at(-1)?.lls ?? null,
    lastPosition: previous?.userId === user.id && previous.trek?.id === trek?.id ? previous.lastPosition : null,
  }
  sessionStore.set(session)
  return session
}
