import type { Checkin, RouteDetail, Waypoint } from "@/lib/types"
import { getRoute } from "@/lib/data"

type Scores = Pick<Checkin, "headache" | "gi" | "fatigue" | "dizziness">

/** One scripted day of the EBC demo: where the trekker walks and sleeps, and the evening check-in. */
export interface DemoDay {
  day: number
  fromId: string
  toId: string
  checkin: Scores
}

/**
 * EBC days 1–7 on the route data's own waypoint ids (src/data/routes/ebc.json).
 * Day 7 sleeps at Lobuche: 4,940 − 4,410 = +530 m, which the AMS engine flags (gain caution).
 */
export const EBC_ITINERARY: DemoDay[] = [
  { day: 1, fromId: "ebc-lukla", toId: "ebc-phakding", checkin: { headache: 0, gi: 0, fatigue: 1, dizziness: 0 } },
  { day: 2, fromId: "ebc-phakding", toId: "ebc-namche", checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0 } },
  { day: 3, fromId: "ebc-namche", toId: "ebc-namche", checkin: { headache: 0, gi: 0, fatigue: 0, dizziness: 0 } },
  { day: 4, fromId: "ebc-namche", toId: "ebc-tengboche", checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0 } },
  { day: 5, fromId: "ebc-tengboche", toId: "ebc-dingboche", checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0 } },
  { day: 6, fromId: "ebc-dingboche", toId: "ebc-dingboche", checkin: { headache: 0, gi: 0, fatigue: 0, dizziness: 0 } },
  { day: 7, fromId: "ebc-dingboche", toId: "ebc-lobuche", checkin: { headache: 0, gi: 0, fatigue: 1, dizziness: 0 } },
]

/** "Bad check-in" step: LLS 7 with headache → warning; with ataxia → danger. */
export const BAD_CHECKIN: Scores = { headache: 2, gi: 2, fatigue: 2, dizziness: 1 }

export const EBC_ROUTE = getRoute("ebc") as RouteDetail

export function waypoint(id: string): Waypoint {
  const wp = EBC_ROUTE.waypoints.find((w) => w.id === id)
  if (!wp) throw new Error(`Unknown EBC waypoint ${id}`)
  return wp
}

/** Walking track for one day: start, midpoint, end (straight-line interpolation, labelled source "demo"). */
export function dayTrack(day: DemoDay): { lat: number; lng: number; altM: number }[] {
  const a = waypoint(day.fromId)
  const b = waypoint(day.toId)
  if (a.id === b.id) return [{ lat: a.lat, lng: a.lng, altM: a.altM }]
  return [0, 0.5, 1].map((t) => ({
    lat: a.lat + (b.lat - a.lat) * t,
    lng: a.lng + (b.lng - a.lng) * t,
    altM: Math.round(a.altM + (b.altM - a.altM) * t),
  }))
}
