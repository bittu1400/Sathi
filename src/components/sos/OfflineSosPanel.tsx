"use client"

import * as React from "react"
import { Copy, Phone, MessageSquare, Check, WifiOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { SosEvent } from "@/lib/types"
import { smsBody, smsHref } from "@/lib/sos"

interface OfflineSosPanelProps {
  sos: SosEvent
  emergencyPhone?: string | null
  trekkerName?: string
  routeName?: string
  locationName?: string
  nearestResources?: { name: string; kind: string; distanceKm: number; phone?: string }[]
  onResolve: () => void
}

export function OfflineSosPanel({
  sos,
  emergencyPhone,
  trekkerName = "Trekker",
  routeName,
  locationName,
  nearestResources = [],
  onResolve,
}: OfflineSosPanelProps) {
  const [copied, setCopied] = React.useState(false)

  const targetNumber =
    emergencyPhone?.trim() ||
    process.env.NEXT_PUBLIC_SOS_SMS_NUMBER ||
    "+9779801234567"

  const textBody = smsBody(sos, {
    trekkerName,
    routeName,
    locationName,
  })

  const linkHref = smsHref(targetNumber, textBody)

  const coordsText =
    sos.lat !== null && sos.lng !== null
      ? `${sos.lat.toFixed(4)}°N, ${sos.lng.toFixed(4)}°E`
      : "Unknown GPS location"

  const copyCoords = () => {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(coordsText)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="p-4 sm:p-6 max-w-lg mx-auto space-y-6 text-foreground">
      {/* Offline Alert Banner */}
      <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-start gap-3">
        <WifiOff className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-500">
            Offline SOS Active
          </p>
          <p className="text-xs text-muted-foreground">
            No mobile data. Alert is queued in local outbox and will send automatically when internet connects.
          </p>
        </div>
      </div>

      {/* Primary SMS Action */}
      <div className="p-5 rounded-2xl bg-red-600 text-white shadow-lg space-y-3 text-center">
        <h3 className="text-lg font-black tracking-tight uppercase">
          Send Emergency SMS
        </h3>
        <p className="text-xs text-red-100">
          SMS works over 2G cellular when data fails. Opens your device messaging app pre-filled with your coordinates.
        </p>

        <a
          href={linkHref}
          className="inline-flex items-center justify-center gap-2 w-full h-12 rounded-xl bg-white text-red-600 font-bold text-sm shadow hover:bg-red-50 transition-colors"
        >
          <MessageSquare className="w-4 h-4" />
          Send SMS ({targetNumber})
        </a>
      </div>

      {/* Readout Coordinates */}
      <div className="p-4 rounded-xl border border-border bg-card space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Trail Coordinates (For Radio / Phone)
          </span>
          <button
            type="button"
            onClick={copyCoords}
            className="flex items-center gap-1 text-xs text-primary hover:underline"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <p className="text-xl font-mono font-bold tracking-tight text-foreground">
          {coordsText}
        </p>
        {sos.altM !== null && (
          <p className="text-xs font-mono text-muted-foreground">
            Altitude: {Math.round(sos.altM)} m
          </p>
        )}
      </div>

      {/* Nearest Emergency Resources */}
      {nearestResources.length > 0 && (
        <div className="p-4 rounded-xl border border-border bg-card space-y-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Nearest Emergency Aid Posts & Helipads
          </h4>
          <div className="divide-y divide-border">
            {nearestResources.slice(0, 3).map((res, i) => (
              <div key={i} className="py-2 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold">{res.name}</p>
                  <p className="text-muted-foreground">
                    {res.distanceKm.toFixed(1)} km away · {res.kind.replace(/_/g, " ")}
                  </p>
                </div>
                {res.phone && (
                  <a
                    href={`tel:${res.phone}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-emerald-600/10 text-emerald-600 font-medium hover:bg-emerald-600/20"
                  >
                    <Phone className="w-3 h-3" />
                    Call
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Safety Subline verbatim from SAFETY §1 */}
      <p className="text-xs text-muted-foreground text-center italic leading-relaxed">
        This alerts coordination and your emergency contact. It is not a guarantee of rescue. Keep trying other means: guide, teahouse phone, other trekkers.
      </p>

      {/* Resolve Action */}
      <div className="pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onResolve}
          className="w-full text-xs font-semibold"
        >
          I&apos;m Safe Now (Resolve SOS)
        </Button>
      </div>
    </div>
  )
}
