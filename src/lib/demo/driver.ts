"use client"

import { createClient } from "@/lib/supabase/client"
import { clearOutbox, flush } from "@/lib/outbox"
import { endTrek, resolveSos } from "@/lib/db/queries"
import { newId } from "@/lib/id"
import { deriveAlerts } from "@/lib/alerts"
import { evaluateWeather } from "@/lib/weather"
import { acknowledgeAlert, recordAlerts, recordCheckin, recordPosition, trekLogStore } from "@/lib/trek-log"
import {
  demoModeStore,
  latestSosStore,
  refreshSession,
  sessionStore,
  weatherFixtureStore,
  type TrekSession,
} from "@/lib/session"
import { sendSos } from "@/lib/sos-actions"
import type { Forecast, RedFlag } from "@/lib/types"
import { BAD_CHECKIN, EBC_ITINERARY, EBC_ROUTE, dayTrack, waypoint, type DemoDay } from "./scenario-ebc"
import stormForecast from "./fixtures/forecast-storm.json"

const DAY_MS = 86_400_000
const NO_AMS = { level: "ok" as const, headline: "", actions: [], reasons: [], alerts: [] }

/**
 * /demo scenario (C-07). Every step goes through the same code paths a real
 * trekker uses: treks via lib/db, positions/check-ins/alerts via the outbox,
 * AMS and weather verdicts from the tested engines, SOS via sos-actions.
 */
async function session(): Promise<TrekSession> {
  const s = (await refreshSession()) ?? sessionStore.get()
  if (!s) throw new Error("Sign in as the demo trekker first (/login).")
  return s
}

/** Demo steps only report success once every queued row reached the server. */
async function flushOrThrow() {
  const { failed } = await flush()
  if (failed) throw new Error(`${failed} row(s) failed to reach the server; they stay queued and retry.`)
}

async function activeTrek() {
  const s = await session()
  if (!s.trek) throw new Error("No active trek. Run “Start EBC trek” first.")
  return { ...s, trek: s.trek }
}

/**
 * Scripted time on demo day N (default 18:00 NPT = 12:15 UTC). "Today" is day 7, so
 * day-7 times that would be in the future are pulled to `minutesAgo` before now:
 * the scripted Lobuche check-in stays earlier than the live one made on stage.
 */
function timeOn(startedAt: string, day: number, hourUtc = 12.25, minutesAgo = 1) {
  const start = new Date(startedAt)
  start.setUTCHours(0, 0, 0, 0)
  const scripted = start.getTime() + (day - 1) * DAY_MS + hourUtc * 3_600_000
  return new Date(Math.min(scripted, Date.now() - minutesAgo * 60_000)).toISOString()
}

async function playDay(trekId: string, startedAt: string, day: DemoDay) {
  const track = dayTrack(day)
  for (const [i, p] of track.entries()) {
    await recordPosition({
      id: newId(),
      trekId,
      ...p,
      accuracyM: 10,
      recordedAt: timeOn(startedAt, day.day, 3 + i * 2, 5 - i), // 08:45, 10:45, 12:45 NPT
      source: "demo",
    })
  }
  const sleep = waypoint(day.toId)
  await recordCheckin(EBC_ROUTE, {
    id: newId(),
    trekId,
    recordedAt: timeOn(startedAt, day.day),
    ...day.checkin,
    redFlags: [],
    sleepWaypointId: sleep.id,
    sleepAltM: sleep.altM,
    lls: day.checkin.headache + day.checkin.gi + day.checkin.fatigue + day.checkin.dizziness,
  })
}

export const demoDriver = {
  /** Resolve my open SOS, end my active trek, clear everything on this device. */
  async reset(): Promise<string> {
    const s = await session()
    const sb = createClient()
    const { data: open, error } = await sb
      .from("sos_events")
      .select("id")
      .eq("user_id", s.userId)
      .neq("status", "resolved")
    if (error) throw new Error(error.message)
    for (const { id } of open ?? []) await resolveSos(sb, id, "Demo reset")
    if (s.trek) await endTrek(sb, s.trek.id, "aborted")

    await clearOutbox()
    trekLogStore.set(null)
    latestSosStore.set(null)
    weatherFixtureStore.set(null)
    localStorage.removeItem("sathiForcedOffline")
    window.dispatchEvent(new Event("storage"))
    demoModeStore.set(1)
    await refreshSession()
    return `Reset: ${open?.length ?? 0} SOS resolved${s.trek ? ", active trek ended" : ""}, device data cleared.`
  },

  /** Active EBC trek that started 6 days ago, so today is day 7 (Lobuche) as in DEMO.md. */
  async startEbcTrek(): Promise<string> {
    const s = await session()
    if (s.trek) throw new Error("A trek is already active. Reset first.")
    const startedAt = new Date(Date.now() - 6 * DAY_MS).toISOString()
    const { error } = await createClient()
      .from("treks")
      .insert({ user_id: s.userId, route_id: "ebc", status: "active", started_at: startedAt })
    if (error) throw new Error(error.message)
    demoModeStore.set(1)
    await refreshSession()
    return "EBC trek started 6 days ago (today is day 7). Share link ready."
  },

  /** Days 1–6: Lukla → Dingboche, symptom-free check-ins; the gain cautions of those days are acknowledged. */
  async fastForwardDingboche(): Promise<string> {
    const { trek } = await activeTrek()
    for (const day of EBC_ITINERARY.slice(0, 6)) await playDay(trek.id, trek.startedAt!, day)
    await flushOrThrow()
    // The trekker saw and acknowledged those days' alerts on the day; today starts clean.
    for (const alert of trekLogStore.get()?.alerts ?? []) {
      if (!alert.acknowledgedAt) await acknowledgeAlert(alert)
    }
    return "Days 1–6 played: Lukla → Dingboche (4,410 m); past alerts acknowledged."
  },

  /** Day 7: Dingboche → Lobuche. The engine raises the +530 m gain caution. */
  async advanceToLobuche(): Promise<string> {
    const { trek } = await activeTrek()
    await playDay(trek.id, trek.startedAt!, EBC_ITINERARY[6]!)
    await flushOrThrow()
    return "Day 7 played: Lobuche (4,940 m), +530 m sleeping gain."
  },

  /** Now, at Lobuche on day 7: LLS 7 (warning), or with ataxia (danger). */
  async submitBadCheckin(includeAtaxia: boolean): Promise<string> {
    const { trek } = await activeTrek()
    const redFlags: RedFlag[] = includeAtaxia ? ["ataxia"] : []
    const lobuche = waypoint("ebc-lobuche")
    const result = await recordCheckin(EBC_ROUTE, {
      id: newId(),
      trekId: trek.id,
      recordedAt: new Date().toISOString(),
      ...BAD_CHECKIN,
      redFlags,
      sleepWaypointId: lobuche.id,
      sleepAltM: lobuche.altM,
      lls: 7,
    })
    await flushOrThrow()
    return `Check-in LLS 7${includeAtaxia ? " + ataxia" : ""}: engine says ${result.level.toUpperCase()}.`
  },

  /** Storm fixture for the next high waypoint after Lobuche; weather engine decides. */
  async injectStormWeather(): Promise<string> {
    const { trek } = await activeTrek()
    const forecast = stormForecast as unknown as Forecast
    weatherFixtureStore.set(forecast)
    const target = waypoint("ebc-gorakshep")
    const verdict = evaluateWeather(forecast, target)
    await recordAlerts(trek.id, deriveAlerts({ ams: NO_AMS, weather: { verdict, waypoint: target }, trekId: trek.id, now: new Date() }))
    await flushOrThrow()
    return `Storm injected for ${target.name}: verdict ${verdict.verdict.toUpperCase()}.`
  },

  setOffline(forced: boolean) {
    if (forced) localStorage.setItem("sathiForcedOffline", "1")
    else localStorage.removeItem("sathiForcedOffline")
    window.dispatchEvent(new Event("storage"))
  },

  /** Altitude-illness SOS at Lobuche; queued if the device is (simulated) offline. */
  async triggerSos(): Promise<string> {
    await activeTrek()
    const lobuche = waypoint("ebc-lobuche")
    const sos = await sendSos("altitude_illness", "Severe headache and stumbling at Lobuche.", lobuche)
    return sos.receivedAt ? "SOS delivered to coordination." : "SOS queued (offline). SMS panel shown on the trek device."
  },

  async backOnlineAndFlush(): Promise<string> {
    this.setOffline(false)
    const { sent, failed } = await flush()
    return `Back online: ${sent} queued item(s) sent${failed ? `, ${failed} failed` : ""}.`
  },
}
