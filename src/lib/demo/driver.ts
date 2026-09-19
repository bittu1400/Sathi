import { createClient } from "@/lib/supabase/client"
import { clearOutbox, enqueue, flush } from "@/lib/outbox"
import { isOnline } from "@/lib/offline/status"
import { buildEbcTimeline, SCENARIO_ALERTS } from "./scenario-ebc"
import stormForecast from "./fixtures/forecast-storm.json"

export interface DemoDriverState {
  activeTrekId: string | null
  shareToken: string | null
  currentDay: number
  altitudeM: number
  isOffline: boolean
  lastSosId: string | null
  history: string[]
}

const LOCAL_STORAGE_ACTIVE_TREK = "sathiActiveTrekId"
const LOCAL_STORAGE_SHARE_TOKEN = "sathiActiveShareToken"

export class DemoDriver {
  private supabase = createClient()

  private async getUserId(): Promise<string> {
    const { data } = await this.supabase.auth.getUser()
    if (data.user?.id) return data.user.id
    // Fallback deterministic demo trekker UUID if running without active session
    return "00000000-0000-0000-0000-000000000001"
  }

  getActiveTrekId(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(LOCAL_STORAGE_ACTIVE_TREK)
  }

  getActiveShareToken(): string | null {
    if (typeof window === "undefined") return null
    return localStorage.getItem(LOCAL_STORAGE_SHARE_TOKEN)
  }

  /**
   * Step 1: Reset
   * Terminate active treks, clear outbox, clear local alerts, resolve open SOS.
   */
  async reset(): Promise<{ ok: boolean; message: string }> {
    const userId = await this.getUserId()

    // 1. Resolve open SOS events
    await this.supabase
      .from("sos_events")
      .update({
        status: "resolved",
        note: "Resolved during demo reset",
      })
      .eq("user_id", userId)
      .neq("status", "resolved")

    // 2. Complete/abort active treks
    await this.supabase
      .from("treks")
      .update({
        status: "completed",
        ended_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("status", "active")

    // 3. Clear outbox queue
    await clearOutbox()

    // 4. Reset browser state flags
    if (typeof window !== "undefined") {
      localStorage.removeItem(LOCAL_STORAGE_ACTIVE_TREK)
      localStorage.removeItem(LOCAL_STORAGE_SHARE_TOKEN)
      localStorage.removeItem("sathiForcedOffline")
      localStorage.removeItem("sathiWeatherFixture")
      localStorage.removeItem("sathiLocalAlerts")
      localStorage.setItem("sathiDemo", "1") // Signal to trek mode to use simulated data
      window.dispatchEvent(new Event("storage"))
    }

    return {
      ok: true,
      message: "Reset completed: active treks closed, SOS resolved, outbox emptied.",
    }
  }

  /**
   * Step 2: Start EBC Trek
   * Creates a trek backdated 8 days, activates a 14-day Trek Pass.
   */
  async startEbcTrek(): Promise<{ ok: boolean; trekId: string; shareToken: string }> {
    const userId = await this.getUserId()
    const trekId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "demo-ebc-trek-01"
    const shareToken = Math.random().toString(36).substring(2, 14)
    const eightDaysAgo = new Date(Date.now() - 8 * 86400000).toISOString()
    const sixDaysFromNow = new Date(Date.now() + 6 * 86400000).toISOString()

    // 1. Insert active trek
    const { error: trekErr } = await this.supabase.from("treks").insert({
      id: trekId,
      user_id: userId,
      route_id: "ebc",
      status: "active",
      started_at: eightDaysAgo,
      share_token: shareToken,
    })

    if (trekErr) throw new Error(`Failed to start trek: ${trekErr.message}`)

    // 2. Insert/update pass
    await this.supabase.from("passes").upsert(
      {
        id: typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "demo-pass-01",
        user_id: userId,
        tier: "pass14",
        status: "active",
        days: 14,
        provider: "mock",
        payment_ref: "DEMO-PASS-EBC-PITCH",
        amount_npr: 3900,
        activated_at: eightDaysAgo,
        expires_at: sixDaysFromNow,
      },
      { onConflict: "user_id" }
    )

    if (typeof window !== "undefined") {
      localStorage.setItem(LOCAL_STORAGE_ACTIVE_TREK, trekId)
      localStorage.setItem(LOCAL_STORAGE_SHARE_TOKEN, shareToken)
      window.dispatchEvent(new Event("storage"))
    }

    return { ok: true, trekId, shareToken }
  }

  /**
   * Step 3: Fast-forward to Dingboche (Days 1–6)
   * Inserts historical GPS coordinates and nightly check-ins up to Dingboche rest day (4,410m).
   */
  async fastForwardDingboche(trekId?: string): Promise<{ ok: boolean; insertedCount: number }> {
    const targetTrekId = trekId || this.getActiveTrekId()
    if (!targetTrekId) throw new Error("No active trek found. Please start an EBC trek first.")

    const timeline = buildEbcTimeline()
    let insertedPositions = 0

    // Process Days 1 through 6
    for (const day of timeline.slice(0, 6)) {
      const dayBaseTime = new Date(Date.now() + day.dateOffsetDays * 86400000)

      // 1. Insert trail positions
      for (let i = 0; i < day.positions.length; i++) {
        const p = day.positions[i]!
        const recordedAt = new Date(dayBaseTime.getTime() + (i * 2 + 8) * 3600000).toISOString() // 08:00, 10:00, etc.

        await enqueue("positions", {
          trek_id: targetTrekId,
          lat: p.lat,
          lng: p.lng,
          alt_m: p.altM,
          accuracy_m: 8.5,
          recorded_at: recordedAt,
          source: "demo",
        })
        insertedPositions++
      }

      // 2. Insert evening check-in (recorded at 19:30 local)
      if (day.checkin) {
        const eveningTime = new Date(dayBaseTime.getTime() + 19.5 * 3600000).toISOString()
        await enqueue("checkins", {
          trek_id: targetTrekId,
          recorded_at: eveningTime,
          headache: day.checkin.headache,
          gi: day.checkin.gi,
          fatigue: day.checkin.fatigue,
          dizziness: day.checkin.dizziness,
          red_flags: day.checkin.redFlags,
          sleep_waypoint_id: day.to.id,
          sleep_alt_m: day.sleepAltM,
        })
      }
    }

    if (isOnline()) {
      await flush(this.supabase)
    }

    return { ok: true, insertedCount: insertedPositions }
  }

  /**
   * Step 4: Advance to Lobuche (Day 7)
   * Advances track to Lobuche (4,940m).
   * Sleep altitude went from 4,410m to 4,940m (+530m gain), triggering R6 caution.
   */
  async advanceToLobuche(trekId?: string): Promise<{ ok: boolean; altitudeM: number }> {
    const targetTrekId = trekId || this.getActiveTrekId()
    if (!targetTrekId) throw new Error("No active trek found. Please start an EBC trek first.")

    const timeline = buildEbcTimeline()
    const day7 = timeline[6]! // Day 7
    const dayBaseTime = new Date(Date.now() + day7.dateOffsetDays * 86400000)

    // 1. Positions along Dingboche -> Thukla -> Lobuche
    for (let i = 0; i < day7.positions.length; i++) {
      const p = day7.positions[i]!
      const recordedAt = new Date(dayBaseTime.getTime() + (i * 2 + 8) * 3600000).toISOString()

      await enqueue("positions", {
        trek_id: targetTrekId,
        lat: p.lat,
        lng: p.lng,
        alt_m: p.altM,
        accuracy_m: 6.0,
        recorded_at: recordedAt,
        source: "demo",
      })
    }

    // 2. Evening check-in at Lobuche (4,940m)
    const eveningTime = new Date(dayBaseTime.getTime() + 19.5 * 3600000).toISOString()
    await enqueue("checkins", {
      trek_id: targetTrekId,
      recorded_at: eveningTime,
      headache: 0,
      gi: 0,
      fatigue: 1,
      dizziness: 0,
      red_flags: [],
      sleep_waypoint_id: "lobuche",
      sleep_alt_m: 4940,
    })

    // 3. R6 Caution alert (+530m gain above 3,000m)
    const alertDef = SCENARIO_ALERTS.altitudeGainCaution
    await enqueue("alerts", {
      trek_id: targetTrekId,
      kind: alertDef.kind,
      severity: alertDef.severity,
      title: alertDef.title,
      body: alertDef.body,
      actions: alertDef.actions,
      dedupe_key: alertDef.dedupeKey,
      created_at: eveningTime,
      acknowledged_at: null,
    })

    if (isOnline()) {
      await flush(this.supabase)
    }

    return { ok: true, altitudeM: 4940 }
  }

  /**
   * Step 5: Bad Check-in (LLS 7)
   * Headache 2, fatigue 2, GI 2, dizziness 1 (total = 7) -> Warning.
   * If includeAtaxia = true -> Red flag ataxia -> Danger.
   */
  async submitBadCheckin(
    opts: { includeAtaxia?: boolean } = {},
    trekId?: string
  ): Promise<{ ok: boolean; severity: string; lls: number }> {
    const targetTrekId = trekId || this.getActiveTrekId()
    if (!targetTrekId) throw new Error("No active trek found.")

    const now = new Date().toISOString()
    const redFlags: string[] = opts.includeAtaxia ? ["ataxia"] : []

    // 1. Enqueue check-in
    await enqueue("checkins", {
      trek_id: targetTrekId,
      recorded_at: now,
      headache: 2,
      gi: 2,
      fatigue: 2,
      dizziness: 1,
      red_flags: redFlags,
      sleep_waypoint_id: "lobuche",
      sleep_alt_m: 4940,
    })

    // 2. Enqueue matching alert
    const alertDef = opts.includeAtaxia ? SCENARIO_ALERTS.ataxiaDanger : SCENARIO_ALERTS.badCheckinWarning

    await enqueue("alerts", {
      trek_id: targetTrekId,
      kind: alertDef.kind,
      severity: alertDef.severity,
      title: alertDef.title,
      body: alertDef.body,
      actions: alertDef.actions,
      dedupe_key: `${alertDef.dedupeKey}:${Date.now()}`,
      created_at: now,
      acknowledged_at: null,
    })

    if (isOnline()) {
      await flush(this.supabase)
    }

    return {
      ok: true,
      severity: alertDef.severity,
      lls: 7,
    }
  }

  /**
   * Step 6: Weather turns
   * Injects high pass storm fixture for Kongma La / Thorong La (75 km/h gusts -> no_go).
   */
  async injectStormWeather(trekId?: string): Promise<{ ok: boolean; verdict: string }> {
    const targetTrekId = trekId || this.getActiveTrekId()

    if (typeof window !== "undefined") {
      localStorage.setItem("sathiWeatherFixture", JSON.stringify(stormForecast))
      window.dispatchEvent(new Event("storage"))
    }

    if (targetTrekId) {
      const alertDef = SCENARIO_ALERTS.stormNoGo
      await enqueue("alerts", {
        trek_id: targetTrekId,
        kind: alertDef.kind,
        severity: alertDef.severity,
        title: alertDef.title,
        body: alertDef.body,
        actions: alertDef.actions,
        dedupe_key: alertDef.dedupeKey,
        created_at: new Date().toISOString(),
        acknowledged_at: null,
      })

      if (isOnline()) {
        await flush(this.supabase)
      }
    }

    return { ok: true, verdict: "no_go" }
  }

  /**
   * Step 7: Go Offline
   * Simulates airplane mode on the operator device.
   */
  setOfflineMode(forced: boolean): { ok: boolean; forcedOffline: boolean } {
    if (typeof window !== "undefined") {
      if (forced) {
        localStorage.setItem("sathiForcedOffline", "1")
      } else {
        localStorage.removeItem("sathiForcedOffline")
      }
      window.dispatchEvent(new Event("storage"))
    }
    return { ok: true, forcedOffline: forced }
  }

  /**
   * Step 8: Trigger SOS
   * Creates an emergency SOS incident at Lobuche (4,940m).
   */
  async triggerSos(trekId?: string): Promise<{ ok: boolean; sosId: string; channel: string }> {
    const targetTrekId = trekId || this.getActiveTrekId()
    const userId = await this.getUserId()
    const sosId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "demo-sos-01"
    const channel = isOnline() ? "online" : "queued"

    const sosPayload = {
      id: sosId,
      trek_id: targetTrekId,
      user_id: userId,
      lat: 27.9483,
      lng: 86.8125,
      alt_m: 4940,
      accuracy_m: 14.0,
      category: "altitude_illness",
      note: "Severe headache (LLS 7) and difficulty balancing at Lobuche high camp.",
      last_checkin_lls: 7,
      created_at: new Date().toISOString(),
      channel: channel,
      status: "open",
    }

    await enqueue("sos_events", sosPayload)

    return { ok: true, sosId, channel }
  }

  /**
   * Step 9: Back Online & Flush
   * Restores connectivity and flushes queued SOS + check-ins to rescue dashboard.
   */
  async backOnlineAndFlush(): Promise<{ ok: boolean; sent: number }> {
    this.setOfflineMode(false)
    const result = await flush(this.supabase)
    return { ok: true, sent: result.sent }
  }
}

export const demoDriver = new DemoDriver()
