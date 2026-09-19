import { RedFlag, Severity } from "@/lib/types"

export interface DemoWaypoint {
  id: string
  name: string
  lat: number
  lng: number
  altM: number
}

export const EBC_WAYPOINTS: Record<string, DemoWaypoint> = {
  lukla: { id: "lukla", name: "Lukla", lat: 27.6869, lng: 86.7297, altM: 2860 },
  phakding: { id: "phakding", name: "Phakding", lat: 27.7408, lng: 86.7131, altM: 2610 },
  namche: { id: "namche", name: "Namche Bazaar", lat: 27.8069, lng: 86.714, altM: 3440 },
  tengboche: { id: "tengboche", name: "Tengboche", lat: 27.8358, lng: 86.764, altM: 3860 },
  dingboche: { id: "dingboche", name: "Dingboche", lat: 27.8931, lng: 86.8322, altM: 4410 },
  lobuche: { id: "lobuche", name: "Lobuche", lat: 27.9483, lng: 86.8125, altM: 4940 },
  gorakshep: { id: "gorakshep", name: "Gorak Shep", lat: 27.9806, lng: 86.8286, altM: 5164 },
  ebc: { id: "ebc", name: "Everest Base Camp", lat: 28.0028, lng: 86.8528, altM: 5364 },
}

export interface DayScenario {
  dayNumber: number
  dateOffsetDays: number // e.g. -7 for 7 days ago
  from: DemoWaypoint
  to: DemoWaypoint
  sleepAltM: number
  isRestDay: boolean
  positions: { lat: number; lng: number; altM: number }[]
  checkin?: {
    headache: 0 | 1 | 2 | 3
    gi: 0 | 1 | 2 | 3
    fatigue: 0 | 1 | 2 | 3
    dizziness: 0 | 1 | 2 | 3
    redFlags: RedFlag[]
  }
}

/**
 * Generates EBC timeline with exact historical timestamps relative to now.
 */
export function buildEbcTimeline(): DayScenario[] {
  return [
    {
      dayNumber: 1,
      dateOffsetDays: -7,
      from: EBC_WAYPOINTS.lukla!,
      to: EBC_WAYPOINTS.phakding!,
      sleepAltM: 2610,
      isRestDay: false,
      positions: [
        { lat: 27.6869, lng: 86.7297, altM: 2860 },
        { lat: 27.7125, lng: 86.7214, altM: 2740 },
        { lat: 27.7408, lng: 86.7131, altM: 2610 },
      ],
      checkin: { headache: 0, gi: 0, fatigue: 1, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 2,
      dateOffsetDays: -6,
      from: EBC_WAYPOINTS.phakding!,
      to: EBC_WAYPOINTS.namche!,
      sleepAltM: 3440,
      isRestDay: false,
      positions: [
        { lat: 27.7408, lng: 86.7131, altM: 2610 },
        { lat: 27.7712, lng: 86.715, altM: 2835 },
        { lat: 27.795, lng: 86.7142, altM: 3100 },
        { lat: 27.8069, lng: 86.714, altM: 3440 },
      ],
      checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 3,
      dateOffsetDays: -5,
      from: EBC_WAYPOINTS.namche!,
      to: EBC_WAYPOINTS.namche!,
      sleepAltM: 3440,
      isRestDay: true,
      positions: [
        { lat: 27.8069, lng: 86.714, altM: 3440 },
        { lat: 27.818, lng: 86.723, altM: 3880 }, // Everest View Hotel acclimatization hike
        { lat: 27.8069, lng: 86.714, altM: 3440 },
      ],
      checkin: { headache: 0, gi: 0, fatigue: 0, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 4,
      dateOffsetDays: -4,
      from: EBC_WAYPOINTS.namche!,
      to: EBC_WAYPOINTS.tengboche!,
      sleepAltM: 3860,
      isRestDay: false,
      positions: [
        { lat: 27.8069, lng: 86.714, altM: 3440 },
        { lat: 27.825, lng: 86.74, altM: 3550 },
        { lat: 27.8358, lng: 86.764, altM: 3860 },
      ],
      checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 5,
      dateOffsetDays: -3,
      from: EBC_WAYPOINTS.tengboche!,
      to: EBC_WAYPOINTS.dingboche!,
      sleepAltM: 4410,
      isRestDay: false,
      positions: [
        { lat: 27.8358, lng: 86.764, altM: 3860 },
        { lat: 27.865, lng: 86.81, altM: 4100 },
        { lat: 27.8931, lng: 86.8322, altM: 4410 },
      ],
      checkin: { headache: 1, gi: 0, fatigue: 1, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 6,
      dateOffsetDays: -2,
      from: EBC_WAYPOINTS.dingboche!,
      to: EBC_WAYPOINTS.dingboche!,
      sleepAltM: 4410,
      isRestDay: true,
      positions: [
        { lat: 27.8931, lng: 86.8322, altM: 4410 },
        { lat: 27.905, lng: 86.845, altM: 4750 }, // Nangkartshang Peak hike
        { lat: 27.8931, lng: 86.8322, altM: 4410 },
      ],
      checkin: { headache: 0, gi: 0, fatigue: 0, dizziness: 0, redFlags: [] },
    },
    {
      dayNumber: 7,
      dateOffsetDays: -1,
      from: EBC_WAYPOINTS.dingboche!,
      to: EBC_WAYPOINTS.lobuche!,
      sleepAltM: 4940, // +530m gain compared to 4410m -> triggers R6 caution!
      isRestDay: false,
      positions: [
        { lat: 27.8931, lng: 86.8322, altM: 4410 },
        { lat: 27.915, lng: 86.82, altM: 4620 }, // Thukla / Dughla
        { lat: 27.9483, lng: 86.8125, altM: 4940 }, // Lobuche
      ],
      checkin: { headache: 0, gi: 0, fatigue: 1, dizziness: 0, redFlags: [] },
    },
  ]
}

export interface DemoStepAlert {
  kind: string
  severity: Severity
  title: string
  body: string
  actions: string[]
  dedupeKey: string
}

/**
 * Standard safety alerts generated for the demo scenarios strictly from SAFETY.md
 */
export const SCENARIO_ALERTS = {
  altitudeGainCaution: {
    kind: "ams_gain",
    severity: "caution" as Severity,
    title: "You're climbing fast.",
    body: "Your sleeping altitude went up 530 m in one day. Above 3,000 m, guidelines recommend going no more than 500 m higher each night.",
    actions: [
      "Consider an extra night here, or sleep lower",
      "Watch for headache, nausea, fatigue",
      "Check in tonight",
    ],
    dedupeKey: "ams_gain:day7",
  },
  badCheckinWarning: {
    kind: "ams_symptoms",
    severity: "warning" as Severity,
    title: "Do not go higher today.",
    body: "Moderate AMS symptoms reported (Lake Louise Score: 7). Guidelines advise resting at this altitude until symptoms resolve.",
    actions: [
      "Rest at this altitude. Do not ascend until your symptoms are gone.",
      "If symptoms get worse, or don't improve within 24 hours, descend.",
      "Drink fluids, eat, avoid alcohol and sleeping pills.",
      "Check in again in 6 hours.",
    ],
    dedupeKey: "ams_symptoms:warning:day7",
  },
  ataxiaDanger: {
    kind: "ams_red_flag",
    severity: "danger" as Severity,
    title: "Descend now. Do not go higher.",
    body: "You reported: can't walk heel-to-toe. This can be a sign of serious altitude illness (HACE).",
    actions: [
      "Start descending with a companion right away, if it is safe to move. Guidelines advise going down at least 300–1,000 m, or until symptoms clearly improve.",
      "Do not stay alone. Tell your guide, teahouse owner, or other trekkers.",
      "Use SOS to alert coordination and your emergency contact.",
      "If you have oxygen or medication prescribed for altitude illness, use it as instructed while descending.",
    ],
    dedupeKey: "ams_red_flag:danger:day7",
  },
  stormNoGo: {
    kind: "weather_nogo",
    severity: "warning" as Severity,
    title: "Not a good day to cross Kongma La.",
    body: "Severe weather forecast: wind gusts up to 82 km/h and heavy snowfall expected. Consider waiting a day. Decide with your guide.",
    actions: [
      "Hold at current altitude or teahouse",
      "Consult your guide and local teahouse operators",
      "Do not attempt high pass crossing during active gale or blizzard",
    ],
    dedupeKey: "weather_nogo:kongma_la:day7",
  },
}
