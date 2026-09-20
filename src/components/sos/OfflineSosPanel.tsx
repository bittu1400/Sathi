"use client"

import * as React from "react"
import { Copy, MessageSquare, Phone } from "lucide-react"
import type { SosEvent } from "@/lib/types"
import { smsBody, smsHref } from "@/lib/sos"
import { SOS_DISCLAIMER } from "@/lib/ams-copy"
import { getRoute } from "@/lib/data"
import { nearestWaypoint } from "@/lib/geo"
import { getNearestResources } from "@/lib/emergency-resources"
import { formatCoords, formatKm } from "@/lib/format"
import { sessionStore } from "@/lib/session"
import type { RouteDetail } from "@/lib/types"
import { markSmsSent } from "@/lib/sos-actions"
import { Banner } from "@/components/ui/banner"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { toast } from "@/components/ui/toast"
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
  const [opened, setOpened] = React.useState(false)

  const hasFix = sos.lat !== null && sos.lng !== null
  const route = session?.trek ? getRoute(session.trek.routeId) : null
  const routeDetail = route && "waypoints" in route ? (route as RouteDetail) : null
  const near = hasFix && routeDetail ? nearestWaypoint(routeDetail, { lat: sos.lat!, lng: sos.lng! }).waypoint.name : undefined

  // Emergency contact first, then the team number (SPEC §9.1). Never an invented fallback.
  const contactPhone = session?.emergencyContactPhone || null
  const smsNumber = contactPhone || process.env.NEXT_PUBLIC_SOS_SMS_NUMBER || null
  const smsTo = contactPhone && session?.emergencyContactName ? session.emergencyContactName : "the SOS team"
  const body = smsBody(sos, {
    trekkerName: session?.displayName ?? "Trekker",
    routeName: route?.name,
    locationName: near,
  })
  const resources = hasFix ? getNearestResources(sos.lat!, sos.lng!, sos.category, sos.altM, 3) : []
  const coords = hasFix ? formatCoords(sos.lat!, sos.lng!) : null

  const copyCoords = async () => {
    if (!coords) return
    try {
      await navigator.clipboard.writeText(coords)
      toast.success("Coordinates copied")
    } catch {
      toast.error("Couldn't copy. Read the coordinates out instead.")
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-4 p-4 text-text sm:p-6">
      {!sos.userId ? (
        <Banner severity="caution" headline="Not signed in" reasons={["Coordination can't receive this SOS. Send the SMS below or call for help."]} />
      ) : (
        <Banner severity="caution" headline="No connection: SOS queued" reasons={["Will send to coordination automatically when signal returns."]} />
      )}

      <div className="space-y-3 rounded-[var(--radius-lg)] border border-sos/60 bg-sos-bg p-4">
        <p className="text-h2 uppercase text-sos">Send emergency SMS</p>
        <p className="text-body text-text-muted">SMS often works when mobile data doesn&apos;t. It opens your messages app with your position filled in.</p>
        {smsNumber ? (
          <>
            <Button asChild variant="sos" size="lg" className="w-full normal-case">
              <a
                href={smsHref(smsNumber, body)}
                onClick={() => {
                  setOpened(true)
                  markSmsSent(sos).catch(() => {})
                }}
              >
                <MessageSquare className="size-5" aria-hidden />
                Send SMS to {smsTo}
              </a>
            </Button>
            <p className="text-small text-text-muted">
              To <span className="font-mono tabular-nums text-text">{smsNumber}</span>. Standard SMS rates may apply.
            </p>
            {opened && <p role="status" className="text-body font-medium text-text">Messages app opened. Press Send there.</p>}
          </>
        ) : (
          <p className="rounded-[var(--radius)] border border-line bg-surface p-3 text-body font-medium">No SMS number set. Add an emergency contact in Settings.</p>
        )}
      </div>

      <Panel title="Your position">
        <div className="flex items-center justify-between gap-3">
          <p className="font-mono text-h2 tabular-nums">{coords ?? "No GPS fix"}</p>
          {coords && (
            <Button variant="ghost" size="icon" aria-label="Copy coordinates" onClick={copyCoords}>
              <Copy className="size-4" aria-hidden />
            </Button>
          )}
        </div>
        {sos.altM !== null && <p className="font-mono text-small tabular-nums text-text-muted">alt {sos.altM.toLocaleString("en-US")} m</p>}
      </Panel>

      {resources.length > 0 && (
        <Panel title="Nearest help">
          <ul className="divide-y divide-line">
            {resources.map((r) => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                <span>
                  <span className="block text-body font-medium">{r.name}</span>
                  <span className="block text-small text-text-muted">
                    <span className="font-mono tabular-nums">{formatKm(r.distanceKm)}</span> · {KIND_LABEL[r.kind] ?? r.kind}
                  </span>
                </span>
                {r.phone && r.verified && (
                  <Button asChild variant="secondary">
                    <a href={`tel:${r.phone}`}>
                      <Phone className="size-4" aria-hidden /> Call
                    </a>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </Panel>
      )}

      <p className="text-center text-small text-text-muted">{SOS_DISCLAIMER}</p>

      <ResolveSosForm onResolve={onResolve} />
    </div>
  )
}
