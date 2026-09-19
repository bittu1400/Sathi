"use client"

import * as React from "react"
import { Copy, Phone, MessageSquare, Check, WifiOff, UserX } from "lucide-react"
import type { SosEvent } from "@/lib/types"
import { smsBody, smsHref } from "@/lib/sos"
import { SOS_DISCLAIMER } from "@/lib/ams-copy"
import { getRoute } from "@/lib/data"
import { nearestWaypoint } from "@/lib/geo"
import { getNearestResources } from "@/lib/emergency-resources"
import { formatKm } from "@/lib/format"
import { sessionStore } from "@/lib/session"
import type { RouteDetail } from "@/lib/types"
import { markSmsSent } from "@/lib/sos-actions"
import { ResolveSosForm } from "./ResolveSosForm"

const KIND_LABEL: Record<string, string> = {
  hra_post: "HRA aid post",
  hospital: "Hospital",
  health_post: "Health post",
  heli_operator: "Helicopter operator",
  helipad: "Helipad",
  police: "Police",
  embassy: "Embassy",
  rescue_org: "Rescue organisation",
}

/** Offline SOS panel (SPEC §9.1 step 4, "Not sent"). */
export function OfflineSosPanel({ sos, onResolve }: { sos: SosEvent; onResolve: (note: string) => Promise<void> }) {
  const session = sessionStore.useValue()
  const [copied, setCopied] = React.useState(false)

  const hasFix = sos.lat !== null && sos.lng !== null
  const route = session?.trek ? getRoute(session.trek.routeId) : null
  const routeDetail = route && "waypoints" in route ? (route as RouteDetail) : null
  const near = hasFix && routeDetail ? nearestWaypoint(routeDetail, { lat: sos.lat!, lng: sos.lng! }).waypoint.name : undefined

  // Emergency contact first, then the team number (SPEC §9.1). Never an invented fallback.
  const smsNumber = session?.emergencyContactPhone || process.env.NEXT_PUBLIC_SOS_SMS_NUMBER || null
  const body = smsBody(sos, {
    trekkerName: session?.displayName ?? "Trekker",
    routeName: route?.name,
    locationName: near,
  })
  const resources = hasFix ? getNearestResources(sos.lat!, sos.lng!, sos.category, sos.altM, 3) : []

  const coords = hasFix
    ? `${Math.abs(sos.lat!).toFixed(4)}°${sos.lat! >= 0 ? "N" : "S"} ${Math.abs(sos.lng!).toFixed(4)}°${sos.lng! >= 0 ? "E" : "W"}`
    : null

  const copyCoords = async () => {
    if (!coords) return
    try {
      await navigator.clipboard.writeText(coords)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard blocked: coordinates stay on screen to read out
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-5 p-4 text-text sm:p-6">
      {!sos.userId ? (
        <Notice icon={<UserX className="h-5 w-5 shrink-0" />} title="Not signed in">
          Coordination can&apos;t receive this SOS. Send the SMS below or call for help.
        </Notice>
      ) : (
        <Notice icon={<WifiOff className="h-5 w-5 shrink-0" />} title="No connection: SOS queued">
          Will send to coordination automatically when signal returns.
        </Notice>
      )}

      <div className="space-y-3 rounded-[var(--radius-lg)] bg-sos p-5 text-center text-sos-ink shadow-lg">
        <p className="text-lg font-black uppercase tracking-tight">Send emergency SMS</p>
        <p className="text-xs opacity-90">SMS often works when mobile data doesn&apos;t. Opens your messages app with your position filled in.</p>
        {smsNumber ? (
          <a
            href={smsHref(smsNumber, body)}
            onClick={() => {
              markSmsSent(sos).catch(() => {})
            }}
            className="inline-flex h-14 w-full items-center justify-center gap-2 rounded-[var(--radius)] bg-bg font-bold text-text shadow focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-sos-ink"
          >
            <MessageSquare className="h-5 w-5" />
            Send SMS to <span className="font-mono tabular-nums">{smsNumber}</span>
          </a>
        ) : (
          <p className="rounded-[var(--radius)] bg-bg p-3 text-sm font-semibold text-text">
            No SMS number set. Add an emergency contact in Settings.
          </p>
        )}
      </div>

      <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-text-muted">Your position</span>
          {coords && (
            <button
              type="button"
              onClick={copyCoords}
              className="flex min-h-12 items-center gap-1 px-2 text-sm text-accent hover:underline"
            >
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
          )}
        </div>
        <p className="font-mono text-2xl font-bold tabular-nums">{coords ?? "No GPS fix"}</p>
        {sos.altM !== null && (
          <p className="font-mono text-sm tabular-nums text-text-muted">alt {sos.altM.toLocaleString("en-US")} m</p>
        )}
      </div>

      {resources.length > 0 && (
        <div className="space-y-2 rounded-[var(--radius)] border border-border bg-surface-2 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-text-muted">Nearest help</p>
          <ul className="divide-y divide-border">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  <span className="block font-semibold">{r.name}</span>
                  <span className="block text-xs text-text-muted">
                    <span className="font-mono tabular-nums">{formatKm(r.distanceKm)}</span> · {KIND_LABEL[r.kind] ?? r.kind}
                  </span>
                </span>
                {r.phone && r.verified && (
                  <a
                    href={`tel:${r.phone}`}
                    className="inline-flex min-h-12 items-center gap-1 rounded-[var(--radius-sm)] bg-ok/15 px-3 font-medium text-ok"
                  >
                    <Phone className="h-4 w-4" />
                    Call
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-center text-xs italic leading-relaxed text-text-muted">{SOS_DISCLAIMER}</p>

      <ResolveSosForm onResolve={onResolve} />
    </div>
  )
}

function Notice({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div role="status" className="flex items-start gap-3 rounded-[var(--radius)] border border-caution/40 bg-caution/10 p-3.5 text-caution">
      {icon}
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-text-muted">{children}</p>
      </div>
    </div>
  )
}
