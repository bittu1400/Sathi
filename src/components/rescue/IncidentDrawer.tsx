"use client";

import React, { useState } from "react";
import { Phone, Copy, Check, MapPin, Clock, ShieldCheck, CheckCircle2, AlertOctagon, TrendingUp, X } from "lucide-react";
import type { Checkin } from "@/lib/types";
import type { SosWithContext } from "@/lib/db/queries";
import { formatAltitude, formatKm, formatNepalTime } from "@/lib/format";
import { getNearestResources } from "@/lib/emergency-resources";
import { RED_FLAG_LABELS } from "@/lib/ams-copy";
import { Button } from "@/components/ui/button";
import { cn } from "cn";
import { CATEGORY_LABELS, STATUS_STYLE, routeName } from "./SosQueue";

interface IncidentDrawerProps {
  event: SosWithContext | null;
  checkins: Checkin[];
  now: number | null;
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, note: string) => Promise<void>;
}

function elapsed(fromIso: string, now: number | null) {
  if (now === null) return "";
  const s = Math.max(0, Math.floor((now - Date.parse(fromIso)) / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h > 0 ? `${h}h ${m}m ${s % 60}s` : `${m}m ${s % 60}s`;
}

/** Keyed by incident id in the parent, so its local state resets on every selection. */
export function IncidentDrawer({ event, checkins, now, onAcknowledge, onResolve }: IncidentDrawerProps) {
  const [copied, setCopied] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  if (!event) {
    return (
      <div className="flex h-full flex-col items-center justify-center bg-bg p-8 text-center text-text-muted">
        <ShieldCheck className="mb-3 h-8 w-8 opacity-60" />
        <h3 className="text-sm font-semibold text-text">No incident selected</h3>
        <p className="mt-1 max-w-xs text-xs">Pick an SOS from the queue to see position, contact and check-ins.</p>
      </div>
    );
  }

  const hasFix = event.lat !== null && event.lng !== null;
  const coords = hasFix ? `${event.lat!.toFixed(4)}N ${event.lng!.toFixed(4)}E` : null;
  const nearest = hasFix ? getNearestResources(event.lat!, event.lng!, event.category, event.altM, 5) : [];

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
    <div className="flex h-full flex-col overflow-y-auto border-l border-border bg-bg">
      <div className="space-y-3 border-b border-border bg-surface-2/30 p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <span className={cn("rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider", STATUS_STYLE[event.status])}>
                {event.status}
              </span>
              <span className="rounded border border-border bg-surface-2 px-1.5 py-0.5 font-mono text-[10px] uppercase text-text-muted">
                {event.channel}
              </span>
            </div>
            <h2 className="text-base font-bold">{event.trekkerName}</h2>
            <p className="text-xs text-text-muted">
              {CATEGORY_LABELS[event.category]} · {routeName(event.routeId)} ·{" "}
              <span className="font-mono">{event.id.slice(0, 8)}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="flex items-center justify-end gap-1 font-mono text-xs font-bold tabular-nums text-warning">
              <Clock className="h-3 w-3" />
              {elapsed(event.createdAt, now)}
            </div>
            <div className="mt-0.5 text-[10px] text-text-muted">Tapped {formatNepalTime(event.createdAt)} NPT</div>
          </div>
        </div>
        {event.note && (
          <p className="rounded-[var(--radius-sm)] border border-border bg-bg p-2.5 text-xs">
            <span className="mb-0.5 block font-semibold text-text/80">Trekker note</span>
            <span className="italic">&ldquo;{event.note}&rdquo;</span>
          </p>
        )}
      </div>

      <div className="flex-1 space-y-5 p-4">
        <section className="space-y-2.5 rounded-[var(--radius)] border border-border bg-surface-2/20 p-3.5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold">
              <MapPin className="h-3.5 w-3.5 text-accent" /> Position
            </h3>
            {coords && (
              <button
                type="button"
                onClick={async () => {
                  await navigator.clipboard.writeText(`${coords} alt ${event.altM ?? "unknown"} m`).catch(() => {});
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex items-center gap-1 font-mono text-[11px] text-accent hover:underline"
              >
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="rounded-[var(--radius-sm)] border border-border bg-bg p-2">
              <span className="block text-[10px] text-text-muted">Coordinates</span>
              <span className="font-mono font-medium tabular-nums">{coords ?? "No GPS fix"}</span>
            </div>
            <div className="rounded-[var(--radius-sm)] border border-border bg-bg p-2">
              <span className="block text-[10px] text-text-muted">Altitude</span>
              <span className="font-mono font-bold tabular-nums">{event.altM !== null ? formatAltitude(event.altM) : "Unknown"}</span>
              {event.accuracyM !== null && (
                <span className="ml-1 font-mono text-[10px] text-text-muted">±{Math.round(event.accuracyM)} m</span>
              )}
            </div>
          </div>
        </section>

        <section className="rounded-[var(--radius)] border border-border bg-surface-2/20 p-3">
          <h3 className="mb-2 text-xs font-semibold">Emergency contact</h3>
          {event.emergencyContact ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium">{event.emergencyContact.name || "Emergency contact"}</p>
                <p className="font-mono text-xs text-text-muted">{event.emergencyContact.phone}</p>
              </div>
              <a
                href={`tel:${event.emergencyContact.phone}`}
                className="flex h-9 items-center gap-1.5 rounded-[var(--radius-sm)] bg-ok px-3 text-xs font-medium text-bg"
              >
                <Phone className="h-3.5 w-3.5" /> Call
              </a>
            </div>
          ) : (
            <p className="text-xs italic text-text-muted">No emergency contact in this trekker&apos;s profile.</p>
          )}
        </section>

        <section className="space-y-2">
          <h3 className="flex items-center gap-1.5 text-xs font-semibold">
            <TrendingUp className="h-3.5 w-3.5 text-accent" /> Recent check-ins
          </h3>
          {checkins.length === 0 ? (
            <p className="rounded-[var(--radius-sm)] border border-border/60 p-3 text-xs text-text-muted">
              {event.trekId ? "No check-ins for this trek yet." : "SOS sent without an active trek."}
            </p>
          ) : (
            <ul className="space-y-1.5">
              {checkins.map((c) => (
                <li key={c.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border/70 bg-bg p-2.5 text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">LLS {c.lls}/12</span>
                      {c.sleepAltM !== null && (
                        <span className="font-mono text-[11px] text-text-muted">sleep {formatAltitude(c.sleepAltM)}</span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[10px] text-text-muted">
                      Headache {c.headache} · GI {c.gi} · Fatigue {c.fatigue} · Dizziness {c.dizziness}
                    </div>
                    {c.redFlags.length > 0 && (
                      <div className="mt-0.5 text-[10px] font-bold text-danger">
                        {c.redFlags.map((f) => RED_FLAG_LABELS[f]).join(" · ")}
                      </div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] text-text-muted">{formatNepalTime(c.recordedAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {nearest.length > 0 && (
          <section className="space-y-2">
            <h3 className="flex items-center gap-1.5 text-xs font-semibold">
              <AlertOctagon className="h-3.5 w-3.5 text-warning" /> Nearest help
            </h3>
            <ul className="space-y-1.5">
              {nearest.map((r) => (
                <li key={r.id} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-border bg-bg p-2.5 text-xs">
                  <div className="max-w-[230px]">
                    <div className="truncate font-medium">{r.name}</div>
                    <div className="font-mono text-[10px] text-text-muted">
                      {formatKm(r.distanceKm)}
                      {r.altM ? ` · ${formatAltitude(r.altM)}` : ""}
                      {r.verified === null ? " · unverified" : ""}
                    </div>
                  </div>
                  {r.phone && r.verified ? (
                    <a
                      href={`tel:${r.phone}`}
                      className="flex h-7 items-center gap-1 rounded border border-border bg-surface-2 px-2.5 text-[11px] font-medium"
                    >
                      <Phone className="h-3 w-3 text-ok" /> Call
                    </a>
                  ) : (
                    <span className="rounded bg-surface-2/40 px-2 py-1 text-[10px] text-text-muted">No verified phone</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {event.status === "resolved" && event.resolutionNotes && (
          <section className="rounded-[var(--radius)] border border-ok/30 bg-ok/10 p-3 text-xs">
            <h3 className="mb-1 font-semibold text-ok">Resolution</h3>
            <p>{event.resolutionNotes}</p>
          </section>
        )}
      </div>

      <div className="space-y-2 border-t border-border bg-surface-2/30 p-4">
        {event.status === "open" && (
          <Button variant="sos" className="w-full normal-case" loading={busy} onClick={() => run(() => onAcknowledge(event.id))}>
            <ShieldCheck className="mr-2 h-4 w-4" /> Acknowledge SOS
          </Button>
        )}
        {event.status !== "resolved" ? (
          <Button variant="outline" className="w-full" onClick={() => setResolveOpen(true)}>
            <CheckCircle2 className="mr-2 h-4 w-4 text-ok" /> Mark resolved
          </Button>
        ) : (
          <p className="rounded-[var(--radius-sm)] border border-ok/30 bg-ok/10 p-2 text-center text-xs font-medium text-ok">
            Resolved{event.resolvedAt ? ` at ${formatNepalTime(event.resolvedAt)} NPT` : ""}
          </p>
        )}
      </div>

      {resolveOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-bg/70 p-4 backdrop-blur-xs">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="resolve-title"
            onKeyDown={(e) => e.key === "Escape" && setResolveOpen(false)}
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run(() => onResolve(event.id, note.trim()))) setResolveOpen(false);
            }}
            className="w-full max-w-md space-y-4 rounded-[var(--radius)] border border-border bg-bg p-5 shadow-2xl"
          >
            <div className="flex items-center justify-between">
              <h3 id="resolve-title" className="text-sm font-bold">
                Resolve incident {event.id.slice(0, 8)}
              </h3>
              <button type="button" aria-label="Close" onClick={() => setResolveOpen(false)} className="text-text-muted hover:text-text">
                <X className="h-4 w-4" />
              </button>
            </div>
            <label className="block space-y-1 text-xs text-text-muted">
              <span>Resolution note for the incident log (required)</span>
              <textarea
                autoFocus
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                required
                rows={3}
                placeholder="e.g. Trekker escorted to Pheriche HRA post by guide"
                className="w-full rounded-[var(--radius-sm)] border border-border bg-surface-2/40 p-2.5 text-xs text-text focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </label>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={() => setResolveOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" size="sm" loading={busy} disabled={!note.trim()}>
                Confirm resolution
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
