import type { SosEvent, SosCategory, SosChannel, SosStatus } from "@/lib/types"
import { formatNepalTime } from "@/lib/format"
import { newId } from "@/lib/id"

export interface BuildSosParams {
  id?: string
  trekId?: string | null
  userId: string
  lat?: number | null
  lng?: number | null
  altM?: number | null
  accuracyM?: number | null
  category: SosCategory
  note?: string | null
  lastCheckinLls?: number | null
  channel?: SosChannel
  status?: SosStatus
}

export function buildSos(params: BuildSosParams): SosEvent {
  return {
    id: params.id || newId(),
    trekId: params.trekId || null,
    userId: params.userId,
    lat: params.lat ?? null,
    lng: params.lng ?? null,
    altM: params.altM ?? null,
    accuracyM: params.accuracyM ?? null,
    category: params.category,
    note: params.note || null,
    lastCheckinLls: params.lastCheckinLls ?? null,
    createdAt: new Date().toISOString(),
    receivedAt: null,
    channel: params.channel || "online",
    status: params.status || "open",
    acknowledgedBy: null,
    acknowledgedAt: null,
    resolvedAt: null,
    resolutionNotes: null,
  }
}

export interface SmsBodyOptions {
  trekkerName: string
  routeName?: string
  locationName?: string
}

export function formatCategoryLabel(cat: SosCategory): string {
  switch (cat) {
    case "altitude_illness":
      return "ALTITUDE ILLNESS"
    case "injury":
      return "TRAUMA / INJURY"
    case "lost":
      return "LOST / OFF TRAIL"
    case "weather":
      return "SEVERE WEATHER"
    case "other":
      return "EMERGENCY"
  }
}

export function smsBody(sos: SosEvent, opts: SmsBodyOptions): string {
  const parts: string[] = ["SOS Sathi"]

  const name = opts.trekkerName?.trim() || "Trekker"
  parts.push(name)

  parts.push(formatCategoryLabel(sos.category))

  if (sos.lat !== null && sos.lng !== null) {
    const latDir = sos.lat >= 0 ? "N" : "S"
    const lngDir = sos.lng >= 0 ? "E" : "W"
    const coordStr = `${Math.abs(sos.lat).toFixed(4)}${latDir} ${Math.abs(sos.lng).toFixed(4)}${lngDir}`
    parts.push(coordStr)
  }

  if (sos.altM !== null) {
    parts.push(`alt ${Math.round(sos.altM)}m`)
  }

  if (opts.locationName) {
    const loc = opts.routeName ? `${opts.locationName} (${opts.routeName})` : opts.locationName
    parts.push(`near ${loc}`)
  } else if (opts.routeName) {
    parts.push(`(${opts.routeName})`)
  }

  if (sos.lastCheckinLls !== null) {
    parts.push(`LLS ${sos.lastCheckinLls}`)
  }

  const timeNpt = formatNepalTime(sos.createdAt)
  parts.push(`${timeNpt} NPT`)

  // Reference code (first 4 chars of UUID in uppercase)
  const refCode = sos.id.replace(/-/g, "").substring(0, 4).toUpperCase()
  parts.push(`Ref ${refCode}.`)

  const body = parts.join(". ")
  // Strictly enforce max 300 characters per SPEC §9.1
  return body.length > 300 ? body.substring(0, 297) + "..." : body
}

export function smsHref(phoneNumber: string, body: string): string {
  const cleanNumber = phoneNumber.replace(/[^\d+]/g, "")
  const encodedBody = encodeURIComponent(body)

  // Standard cross-platform separator '?&body=' works reliably across modern iOS and Android
  return `sms:${cleanNumber}?&body=${encodedBody}`
}
