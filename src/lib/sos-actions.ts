"use client"

import { createClient } from "@/lib/supabase/client"
import { enqueue, flush, getOutboxItems, patchQueued } from "@/lib/outbox"
import { isOnline } from "@/lib/offline/status"
import { resolveSos } from "@/lib/db/queries"
import { sosToRow } from "@/lib/db/map"
import { buildSos } from "@/lib/sos"
import { getRoute } from "@/lib/data"
import { estimateAltitude } from "@/lib/geo"
import { latestSosStore, sessionStore } from "@/lib/session"
import type { RouteDetail, SosCategory, SosEvent } from "@/lib/types"

const GPS_TIMEOUT_MS = 5000
const FLUSH_TIMEOUT_MS = 8000

function currentPosition(): Promise<GeolocationPosition | null> {
  if (typeof navigator === "undefined" || !navigator.geolocation) return Promise.resolve(null)
  return new Promise((resolve) =>
    navigator.geolocation.getCurrentPosition(resolve, () => resolve(null), {
      timeout: GPS_TIMEOUT_MS,
      enableHighAccuracy: true,
      maximumAge: 30000,
    })
  )
}

async function isQueued(id: string) {
  return (await getOutboxItems()).some((i) => i.id === id)
}

/** SPEC §9.1 steps 3–4. Resolves once the SOS is either delivered or queued. */
export async function sendSos(
  category: SosCategory,
  note: string,
  /** /demo only: a scripted position instead of the device GPS. */
  demoPosition?: { lat: number; lng: number; altM: number },
): Promise<SosEvent> {
  const session = sessionStore.get()
  const fix = demoPosition
    ? ({ coords: { latitude: demoPosition.lat, longitude: demoPosition.lng, altitude: demoPosition.altM, altitudeAccuracy: 5, accuracy: 10 } } as GeolocationPosition)
    : await currentPosition()
  const last = session?.lastPosition ?? null
  const lat = fix?.coords.latitude ?? last?.lat ?? null
  const lng = fix?.coords.longitude ?? last?.lng ?? null

  const route = session?.trek ? getRoute(session.trek.routeId) : null
  let altM = fix?.coords.altitude ?? null
  if (lat !== null && lng !== null && route && "waypoints" in route) {
    altM = estimateAltitude(route as RouteDetail, { lat, lng }, altM, fix?.coords.altitudeAccuracy ?? null)
  } else if (altM === null) {
    altM = last?.altM ?? null
  }

  const sos = buildSos({
    userId: session?.userId ?? "",
    trekId: session?.trek?.id ?? null,
    lat,
    lng,
    altM: altM === null ? null : Math.round(altM),
    accuracyM: fix?.coords.accuracy ?? last?.accuracyM ?? null,
    category,
    note: note.trim() || null,
    lastCheckinLls: session?.lastLls ?? null,
    channel: isOnline() ? "online" : "queued",
  })
  latestSosStore.set(sos)

  // Signed out: nothing can reach coordination except SMS / phone.
  if (!session) return sos

  await enqueue("sos_events", sosToRow(sos), { autoFlush: false })

  if (isOnline()) {
    await Promise.race([flush().catch(() => null), new Promise((r) => setTimeout(r, FLUSH_TIMEOUT_MS))])
    if (!(await isQueued(sos.id))) {
      const delivered = { ...sos, receivedAt: new Date().toISOString() }
      latestSosStore.set(delivered)
      return delivered
    }
  }
  const queued = { ...sos, channel: "queued" as const }
  await patchQueued(sos.id, { channel: "queued" })
  latestSosStore.set(queued)
  return queued
}

/** Tapping "Send SMS": the queued row records that SMS was used (SPEC §9.1). */
export async function markSmsSent(sos: SosEvent) {
  await patchQueued(sos.id, { channel: "sms" })
  latestSosStore.set({ ...sos, channel: "sms" })
}

/** Called whenever the outbox changes: a queued SOS that left the device is delivered. */
export async function syncSosDelivery() {
  const sos = latestSosStore.get()
  const session = sessionStore.get()
  if (!sos || sos.receivedAt || !session || sos.userId !== session.userId) return
  if (!(await isQueued(sos.id))) {
    latestSosStore.set({ ...sos, receivedAt: new Date().toISOString() })
  }
}

/** SPEC §9.1 step 5. Throws when the server can't be reached and the row already left. */
export async function resolveOwnSos(sos: SosEvent, note: string) {
  const resolvedAt = new Date().toISOString()
  const text = note.trim() || null
  const stillQueued = await patchQueued(sos.id, {
    status: "resolved",
    resolved_at: resolvedAt,
    resolution_note: text,
  })
  if (!stillQueued && sos.userId) {
    await resolveSos(createClient(), sos.id, text)
  }
  latestSosStore.set({ ...sos, status: "resolved", resolvedAt, resolutionNotes: text })
}
