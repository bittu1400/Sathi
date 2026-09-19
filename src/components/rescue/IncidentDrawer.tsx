"use client";

import React, { useState } from "react";
import { CheckCircle2, Copy, MapPin, Phone, ShieldCheck } from "lucide-react";
import type { Checkin } from "@/lib/types";
import type { SosWithContext } from "@/lib/db/queries";
import { formatAltitude, formatCoords, formatKm, formatNepalTime } from "@/lib/format";
import { getNearestResources } from "@/lib/emergency-resources";
import { RED_FLAG_LABELS } from "@/lib/ams-copy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/field";
import { Kbd } from "@/components/ui/kbd";
import { Panel } from "@/components/ui/panel";
import { SaveState } from "@/components/ui/save-state";
import { Status } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";
import { CATEGORY_LABELS, STATUS_TONE, elapsed, routeName } from "./SosQueue";

interface IncidentDrawerProps {
  event: SosWithContext | null;
  checkins: Checkin[];
  now: number | null;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, note: string) => Promise<void>;
  resolveOpen: boolean;
  onResolveOpenChange: (open: boolean) => void;
}

/** Copies "27.9881° N, 86.9250° E alt 4,940 m"; the toast only shows on real success. */
export async function copyCoordinates(event: SosWithContext) {
  if (event.lat === null || event.lng === null) return toast.error("This SOS has no GPS fix.");
  try {
    await navigator.clipboard.writeText(`${formatCoords(event.lat, event.lng)}${event.altM !== null ? ` alt ${formatAltitude(event.altM)}` : ""}`);
    toast.success("Coordinates copied");
  } catch {
    toast.error("Couldn't copy. Read the coordinates out instead.");
  }
}

function Step({ label, at }: { label: string; at: string | null }) {
  return (
    <li className="flex items-baseline justify-between gap-3 py-1.5">
      <span className={at ? "text-body" : "text-body text-text-muted"}>{label}</span>
      <span className="font-mono text-small tabular-nums text-text-muted">{at ? `${formatNepalTime(at)} NPT` : "—"}</span>
    </li>
  );
}

/** Keyed by incident id in the parent, so its local state resets on every selection. */
export function IncidentDrawer({ event, checkins, now, onAcknowledge, onResolve, resolveOpen, onResolveOpenChange }: IncidentDrawerProps) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 bg-bg p-8 text-center text-text-muted">
        <ShieldCheck className="size-7" aria-hidden />
        <h3 className="text-h2 text-text">No incident selected</h3>
        <p className="max-w-xs">Pick an SOS from the queue to see position, contact and check-ins.</p>
      </div>
    );
  }

  const hasFix = event.lat !== null && event.lng !== null;
  const nearest = hasFix ? getNearestResources(event.lat!, event.lng!, event.category, event.altM, 5) : [];
  const latest = checkins[0] ?? null;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    try {
      await action();
      return true;
    } catch {
      return false; // the console shows the error banner
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto bg-bg">
      <div className="space-y-2 border-b border-line p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-h2">{event.trekkerName}</h2>
            <p className="text-small text-text-muted">
              {CATEGORY_LABELS[event.category]} · {routeName(event.routeId)}
            </p>
          </div>
          <div className="text-right">
            <Status tone={STATUS_TONE[event.status]}>{event.status}</Status>
            <p className="mt-1 font-mono text-small tabular-nums text-text-muted">{elapsed(event.createdAt, now)}</p>
          </div>
        </div>
        {event.note && (
          <p className="text-body">
            <span className="text-label text-text-muted">Trekker note </span>
            <span className="italic">&ldquo;{event.note}&rdquo;</span>
          </p>
        )}
      </div>

      <div className="flex-1 space-y-4 p-4">
        <Panel title="Timeline">
          <ol className="divide-y divide-line">
            <Step label="Tapped SOS" at={event.createdAt} />
            <Step label="Received" at={event.receivedAt} />
            <Step label="Acknowledged" at={event.acknowledgedAt} />
            <Step label="Resolved" at={event.resolvedAt} />
          </ol>
          {event.status === "resolved" && event.resolutionNotes && <p className="mt-2 text-body">{event.resolutionNotes}</p>}
        </Panel>

        <Panel
          title="Position"
          actions={
            hasFix && (
              <Button size="sm" variant="ghost" onClick={() => copyCoordinates(event)}>
                <Copy className="size-4" aria-hidden /> Copy <Kbd>C</Kbd>
              </Button>
            )
          }
        >
          <p className="flex items-center gap-2 font-mono text-h2 tabular-nums">
            <MapPin className="size-4 shrink-0 text-accent" aria-hidden />
            {hasFix ? formatCoords(event.lat!, event.lng!) : "No GPS fix"}
          </p>
          <p className="mt-1 font-mono text-small tabular-nums text-text-muted">
            {event.altM !== null ? formatAltitude(event.altM) : "Altitude unknown"}
            {event.accuracyM !== null && ` · ±${Math.round(event.accuracyM)} m`}
          </p>
        </Panel>

        <Panel title="Emergency contact">
          {event.emergencyContact ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-body">{event.emergencyContact.name || "Emergency contact"}</p>
                <p className="font-mono text-small tabular-nums text-text-muted">{event.emergencyContact.phone}</p>
              </div>
              <Button asChild variant="secondary">
                <a href={`tel:${event.emergencyContact.phone}`}>
                  <Phone className="size-4" aria-hidden /> Call
                </a>
              </Button>
            </div>
          ) : (
            <p className="text-text-muted">No emergency contact in this trekker&apos;s profile.</p>
          )}
        </Panel>

        <Panel title="Latest check-in">
          {latest ? (
            <div className="space-y-1">
              <p className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-h2 tabular-nums">LLS {latest.lls}/12</span>
                <span className="font-mono text-small text-text-muted">{formatNepalTime(latest.recordedAt)} NPT</span>
                {latest.sleepAltM !== null && <span className="font-mono text-small text-text-muted">sleep {formatAltitude(latest.sleepAltM)}</span>}
              </p>
              <p className="text-small text-text-muted">
                Headache {latest.headache} · Stomach {latest.gi} · Fatigue {latest.fatigue} · Dizziness {latest.dizziness}
              </p>
              {latest.redFlags.length > 0 && <p className="text-body font-medium text-danger">{latest.redFlags.map((f) => RED_FLAG_LABELS[f]).join(" · ")}</p>}
            </div>
          ) : (
            <p className="text-text-muted">{event.trekId ? "No check-ins for this trek yet." : "SOS sent without an active trek."}</p>
          )}
        </Panel>

        {nearest.length > 0 && (
          <Panel title="Nearest help">
            <ul className="divide-y divide-line">
              {nearest.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-body">{r.name}</p>
                    <p className="font-mono text-small tabular-nums text-text-muted">
                      {formatKm(r.distanceKm)}
                      {r.altM ? ` · ${formatAltitude(r.altM)}` : ""}
                    </p>
                  </div>
                  {r.phone && r.verified ? (
                    <Button asChild variant="secondary" size="sm">
                      <a href={`tel:${r.phone}`}>
                        <Phone className="size-4" aria-hidden /> Call
                      </a>
                    </Button>
                  ) : (
                    <Status unverified>No verified phone</Status>
                  )}
                </li>
              ))}
            </ul>
          </Panel>
        )}
      </div>

      <div className="space-y-2 border-t border-line p-4">
        {event.status === "open" && (
          <Button variant="primary" className="w-full" state={busy ? "busy" : "idle"} onClick={() => run(() => onAcknowledge(event.id))}>
            <ShieldCheck className="size-4" aria-hidden /> Acknowledge <Kbd>A</Kbd>
          </Button>
        )}
        {event.status !== "resolved" ? (
          <Button variant="secondary" className="w-full" onClick={() => onResolveOpenChange(true)}>
            <CheckCircle2 className="size-4 text-ok" aria-hidden /> Mark resolved <Kbd>R</Kbd>
          </Button>
        ) : (
          <p className="text-center text-body text-ok">Resolved{event.resolvedAt ? ` at ${formatNepalTime(event.resolvedAt)} NPT` : ""}</p>
        )}
      </div>

      <Dialog open={resolveOpen} onOpenChange={onResolveOpenChange}>
        <DialogContent title="Resolve this incident" description={`${event.trekkerName} · ${event.id.slice(0, 8)}. The note goes in the incident log.`}>
          <form
            className="space-y-4"
            onSubmit={async (e) => {
              e.preventDefault();
              setFailed(false);
              if (await run(() => onResolve(event.id, note.trim()))) {
                onResolveOpenChange(false);
                toast.success("Incident resolved");
              } else {
                setFailed(true);
              }
            }}
          >
            <Field label="Resolution note" required>
              {(p) => <Textarea {...p} autoFocus value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} rows={3} placeholder="e.g. Trekker escorted to Pheriche HRA post by guide" />}
            </Field>
            <div className="flex items-center justify-between gap-3">
              <SaveState state={busy ? "saving" : failed ? "error" : "idle"} />
              <div className="flex gap-2">
                <Button type="button" variant="ghost" onClick={() => onResolveOpenChange(false)}>
                  Cancel
                </Button>
                <Button type="submit" state={busy ? "busy" : "idle"} disabled={!note.trim()}>
                  Confirm resolution
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
