import { describe, it, expect } from "vitest"
import { BAD_CHECKIN, EBC_ITINERARY, EBC_ROUTE, dayTrack, waypoint } from "./scenario-ebc"
import stormForecast from "./fixtures/forecast-storm.json"
import { amsInputFromCheckins, evaluateAms } from "@/lib/ams"
import { evaluateWeather } from "@/lib/weather"
import type { Checkin, Forecast } from "@/lib/types"

// Scripted check-ins on consecutive Nepal evenings, as the driver records them.
function scenarioCheckins(days: typeof EBC_ITINERARY, extra?: Partial<Checkin>): Checkin[] {
  const rows = days.map((d, i): Checkin => {
    const sleep = waypoint(d.toId)
    return {
      id: `c${i}`,
      trekId: "t",
      recordedAt: new Date(Date.UTC(2026, 8, 10 + i, 12, 15)).toISOString(),
      ...d.checkin,
      redFlags: [],
      sleepWaypointId: sleep.id,
      sleepAltM: sleep.altM,
      lls: d.checkin.headache + d.checkin.gi + d.checkin.fatigue + d.checkin.dizziness,
    }
  })
  if (extra) rows.push({ ...rows.at(-1)!, id: "extra", recordedAt: new Date(Date.UTC(2026, 8, 17, 6)).toISOString(), ...extra })
  return rows
}

const start = EBC_ROUTE.waypoints[0]!.altM
const level = (checkins: Checkin[]) => evaluateAms(amsInputFromCheckins(start, checkins))

describe("EBC demo scenario (C-07)", () => {
  it("uses only waypoint ids that exist in the route data", () => {
    for (const d of EBC_ITINERARY) {
      expect(() => waypoint(d.fromId)).not.toThrow()
      expect(() => waypoint(d.toId)).not.toThrow()
      expect(dayTrack(d).length).toBeGreaterThan(0)
    }
  })

  it("days 1–6 stay free of warnings and danger", () => {
    const result = level(scenarioCheckins(EBC_ITINERARY.slice(0, 6)))
    expect(["ok", "info", "caution"]).toContain(result.level)
    expect(result.alerts.filter((a) => a.severity === "warning" || a.severity === "danger")).toEqual([])
  })

  it("day 7 at Lobuche triggers the +530 m gain caution from the engine", () => {
    const result = level(scenarioCheckins(EBC_ITINERARY))
    expect(result.alerts.map((a) => a.kind)).toContain("ams_gain")
  })

  it("the bad check-in is a warning, and a danger with ataxia", () => {
    expect(level(scenarioCheckins(EBC_ITINERARY, { ...BAD_CHECKIN, lls: 7 })).level).toBe("warning")
    expect(level(scenarioCheckins(EBC_ITINERARY, { ...BAD_CHECKIN, lls: 7, redFlags: ["ataxia"] })).level).toBe("danger")
  })

  it("the storm fixture is a no-go for Gorak Shep, even when the fixture date is in the past", () => {
    const verdict = evaluateWeather(stormForecast as unknown as Forecast, waypoint("ebc-gorakshep"), new Date("2027-01-01"))
    expect(verdict.verdict).toBe("no_go")
  })
})
