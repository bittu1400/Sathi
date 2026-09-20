"use client"

import * as React from "react"
import Link from "next/link"
import { Phone } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Panel } from "@/components/ui/panel"
import { useSos } from "@/components/sos/SosProvider"
import { SosActiveView } from "@/components/sos/SosActiveView"
import { getResources } from "@/lib/data"
import { formatCoords } from "@/lib/format"
import { latestSosStore, sessionStore } from "@/lib/session"

/** SPEC §9.1 step 6: my latest SOS from local state, or the emergency hub. Works offline. */
export default function SosPage() {
  const sos = latestSosStore.useValue()
  const session = sessionStore.useValue()
  const { open } = useSos()
  const active = sos && sos.status !== "resolved" ? sos : null
  const verified = getResources().filter((r) => r.phone && r.verified)
  const last = session?.lastPosition

  return (
    <div className="mx-auto max-w-lg space-y-4 py-2">
      <h1 className="text-h1">Emergency</h1>
      {active ? (
        <div className="rounded-[var(--radius-lg)] border border-sos/60 bg-surface">
          <SosActiveView sos={active} />
        </div>
      ) : (
        <>
          <Panel className="space-y-3">
            <p className="text-body text-text-muted">
              In an emergency, send an SOS. Without data — or without an account — your phone
              prepares the message and you send it by SMS, WhatsApp or a call.
            </p>
            <Button type="button" variant="sos" size="lg" onClick={() => open()} className="w-full">
              Send SOS
            </Button>
          </Panel>

          <Panel title="Your emergency contact">
            {session?.emergencyContactPhone ? (
              <Button asChild variant="secondary" className="w-full">
                <a href={`tel:${session.emergencyContactPhone}`}>
                  <Phone className="size-4" aria-hidden />
                  Call {session.emergencyContactName ?? "contact"}
                  <span className="font-mono tabular-nums">{session.emergencyContactPhone}</span>
                </a>
              </Button>
            ) : (
              <p className="text-text-muted">
                None saved yet. <Link href="/settings" className="text-accent hover:underline">Add one in Settings</Link>.
              </p>
            )}
          </Panel>

          <Panel title="Verified numbers">
            {verified.length > 0 ? (
              <ul className="divide-y divide-line">
                {verified.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                    <span className="text-body">{r.name}</span>
                    <Button asChild variant="secondary">
                      <a href={`tel:${r.phone}`}>
                        <Phone className="size-4" aria-hidden /> Call
                      </a>
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-text-muted">Numbers are being verified.</p>
            )}
          </Panel>

          <Panel title="Last known position">
            <p className="font-mono text-h2 tabular-nums">{last ? formatCoords(last.lat, last.lng) : "No position saved yet"}</p>
          </Panel>
        </>
      )}
    </div>
  )
}
