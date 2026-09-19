"use client"

import { createClient } from "@/lib/supabase/client"
import { createLocalStore } from "@/lib/local-store"
import { enqueue, patchQueued } from "@/lib/outbox"
import { isOnline } from "@/lib/offline/status"
import { alertToRow, checkinToRow, positionToRow } from "@/lib/db/map"
import { listAlerts, listCheckins, listPositions } from "@/lib/db/queries"
import { amsInputFromCheckins, evaluateAms } from "@/lib/ams"
import { deriveAlerts } from "@/lib/alerts"
import { updateSession } from "@/lib/session"
import type { Alert, AmsResult, Checkin, Position, RouteDetail } from "@/lib/types"

/**
 * The active trek's positions, check-ins and alerts on this device.
 * Server data is merged in when online; local writes go through the outbox.
 */
export interface TrekLog {
  trekId: string
  positions: Position[]
  checkins: Checkin[]
  alerts: Alert[]
}

const MAX_POSITIONS = 300
export const trekLogStore = createLocalStore<TrekLog>("sathiTrekLog")

function merge<T extends { id: string }>(base: T[], extra: T[], key: (x: T) => string = (x) => x.id): T[] {
  const map = new Map(base.map((x) => [key(x), x]))
  for (const x of extra) if (!map.has(key(x))) map.set(key(x), x)
  return [...map.values()]
}

const byTime = <T>(get: (x: T) => string) => (a: T, b: T) => get(a).localeCompare(get(b))

function current(trekId: string): TrekLog {
  const log = trekLogStore.get()
  return log?.trekId === trekId ? log : { trekId, positions: [], checkins: [], alerts: [] }
}

function save(log: TrekLog) {
  trekLogStore.set({
    ...log,
    positions: log.positions.sort(byTime((p) => p.recordedAt)).slice(-MAX_POSITIONS),
    checkins: log.checkins.sort(byTime((c) => c.recordedAt)),
    alerts: log.alerts.sort(byTime((a) => a.createdAt)).reverse(),
  })
}

/** Server copy wins; rows only on this device (still queued) are kept. */
export async function refreshTrekLog(trekId: string) {
  if (!isOnline()) return
  const sb = createClient()
  const [positions, checkins, alerts] = await Promise.all([
    listPositions(sb, trekId, MAX_POSITIONS),
    listCheckins(sb, trekId),
    listAlerts(sb, trekId),
  ])
  const local = current(trekId)
  save({
    trekId,
    positions: merge(positions, local.positions),
    checkins: merge(checkins, local.checkins),
    alerts: merge(alerts, local.alerts, (a) => a.dedupeKey),
  })
  const last = positions.at(-1)
  if (last) {
    updateSession({
      lastPosition: { lat: last.lat, lng: last.lng, altM: last.altM, accuracyM: last.accuracyM, recordedAt: last.recordedAt },
    })
  }
  const lastCheckin = checkins.at(-1)
  if (lastCheckin) updateSession({ lastLls: lastCheckin.lls })
}

export async function recordPosition(position: Position) {
  await enqueue("positions", { ...positionToRow(position) })
  const log = current(position.trekId)
  save({ ...log, positions: [...log.positions, position] })
  updateSession({
    lastPosition: {
      lat: position.lat,
      lng: position.lng,
      altM: position.altM,
      accuracyM: position.accuracyM,
      recordedAt: position.recordedAt,
    },
  })
}

export async function recordAlerts(trekId: string, alerts: Alert[]) {
  const log = current(trekId)
  const known = new Set(log.alerts.map((a) => a.dedupeKey))
  const fresh = alerts.filter((a) => !known.has(a.dedupeKey))
  for (const alert of fresh) await enqueue("alerts", { ...alertToRow(alert) })
  if (fresh.length) save({ ...log, alerts: [...log.alerts, ...fresh] })
}

/** Save a check-in, run the AMS engine on the full history, store the derived alerts. */
export async function recordCheckin(route: RouteDetail, checkin: Checkin): Promise<AmsResult> {
  const log = current(checkin.trekId)
  const checkins = [...log.checkins, checkin]
  const startAltM = route.waypoints[0]?.altM ?? checkin.sleepAltM ?? 0
  const result = evaluateAms(amsInputFromCheckins(startAltM, checkins))

  await enqueue("checkins", { ...checkinToRow(checkin) })
  save({ ...log, checkins })
  updateSession({ lastLls: checkin.lls })
  await recordAlerts(checkin.trekId, deriveAlerts({ ams: result, trekId: checkin.trekId, now: new Date() }))
  return result
}

export async function acknowledgeAlert(alert: Alert) {
  const acknowledgedAt = new Date().toISOString()
  const log = current(alert.trekId)
  save({ ...log, alerts: log.alerts.map((a) => (a.id === alert.id ? { ...a, acknowledgedAt } : a)) })
  // Not sent yet: the row leaves the device already acknowledged.
  await patchQueued(alert.id, { acknowledged_at: acknowledgedAt })
  if (isOnline()) {
    // dedupe_key, not id: the server may hold an earlier row for the same alert.
    const { error } = await createClient()
      .from("alerts")
      .update({ acknowledged_at: acknowledgedAt })
      .eq("trek_id", alert.trekId)
      .eq("dedupe_key", alert.dedupeKey)
    if (error) throw new Error(error.message)
  }
}
