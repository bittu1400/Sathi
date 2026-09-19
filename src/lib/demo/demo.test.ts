import { describe, it, expect } from "vitest"
import { buildEbcTimeline, SCENARIO_ALERTS } from "./scenario-ebc"
import stormForecast from "./fixtures/forecast-storm.json"
import { demoDriver } from "./driver"

describe("Demo Scenario & Driver (C-07)", () => {
  it("generates a valid 7-day EBC timeline with proper altitude progression", () => {
    const timeline = buildEbcTimeline()
    expect(timeline).toHaveLength(7)

    // Day 1: Lukla -> Phakding
    expect(timeline[0]!.from.id).toBe("lukla")
    expect(timeline[0]!.to.id).toBe("phakding")
    expect(timeline[0]!.sleepAltM).toBe(2610)

    // Day 6: Dingboche Rest Day
    expect(timeline[5]!.from.id).toBe("dingboche")
    expect(timeline[5]!.to.id).toBe("dingboche")
    expect(timeline[5]!.isRestDay).toBe(true)
    expect(timeline[5]!.sleepAltM).toBe(4410)

    // Day 7: Lobuche (+530m gain)
    expect(timeline[6]!.from.id).toBe("dingboche")
    expect(timeline[6]!.to.id).toBe("lobuche")
    expect(timeline[6]!.sleepAltM).toBe(4940)
    expect(timeline[6]!.sleepAltM - timeline[5]!.sleepAltM).toBe(530)
  })

  it("ensures scenario alerts match SAFETY.md wording exactly", () => {
    // Altitude Gain R6 Caution
    expect(SCENARIO_ALERTS.altitudeGainCaution.severity).toBe("caution")
    expect(SCENARIO_ALERTS.altitudeGainCaution.title).toBe("You're climbing fast.")
    expect(SCENARIO_ALERTS.altitudeGainCaution.body).toContain(
      "recommend going no more than 500 m higher each night"
    )

    // Bad Check-in LLS 7 Warning
    expect(SCENARIO_ALERTS.badCheckinWarning.severity).toBe("warning")
    expect(SCENARIO_ALERTS.badCheckinWarning.title).toBe("Do not go higher today.")

    // Red Flag Ataxia Danger
    expect(SCENARIO_ALERTS.ataxiaDanger.severity).toBe("danger")
    expect(SCENARIO_ALERTS.ataxiaDanger.title).toBe("Descend now. Do not go higher.")
    expect(SCENARIO_ALERTS.ataxiaDanger.body).toContain("can't walk heel-to-toe")

    // High Pass Storm No-Go
    expect(SCENARIO_ALERTS.stormNoGo.severity).toBe("warning")
    expect(SCENARIO_ALERTS.stormNoGo.title).toContain("Kongma La")
  })

  it("verifies storm forecast fixture triggers no_go thresholds", () => {
    expect(stormForecast.elevation).toBe(5535)
    expect(stormForecast.daily.wind_gusts_10m_max[0]).toBeGreaterThanOrEqual(70)
    expect(stormForecast.daily.snowfall_sum[0]).toBeGreaterThanOrEqual(15)
  })

  it("handles offline toggling via driver state", () => {
    const offlineResult = demoDriver.setOfflineMode(true)
    expect(offlineResult.forcedOffline).toBe(true)

    const onlineResult = demoDriver.setOfflineMode(false)
    expect(onlineResult.forcedOffline).toBe(false)
  })
})
