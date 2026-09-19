"use client";

import React, { useEffect, useState } from "react";
import type { ExtendedSosEvent } from "./SosQueue";
import type { Checkin } from "@/lib/types";
import { formatAltitude, formatNepalTime } from "@/lib/format";
import { getNearestResources } from "@/lib/emergency-resources";
import {
  Phone,
  Copy,
  Check,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  TrendingUp,
  X,
} from "lucide-react";

interface IncidentDrawerProps {
  event: ExtendedSosEvent | null;
  checkins?: Checkin[];
  onAcknowledge: (id: string) => Promise<void>;
  onResolve: (id: string, note: string) => Promise<void>;
  emergencyContact?: { name: string; phone: string } | null;
}

export function IncidentDrawer({
  event,
  checkins = [],
  onAcknowledge,
  onResolve,
  emergencyContact,
}: IncidentDrawerProps) {
  const [copiedCoords, setCopiedCoords] = useState(false);
  const [resolveOpen, setResolveOpen] = useState(false);
  const [resolveNote, setResolveNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [now, setNow] = useState<number>(() =>
    typeof window !== "undefined" ? Date.now() : 0
  );

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);

  if (!event) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-muted-foreground bg-background">
        <div className="h-12 w-12 rounded-full bg-muted/40 flex items-center justify-center mb-3">
          <ShieldCheck className="h-6 w-6 text-muted-foreground/60" />
        </div>
        <h3 className="font-semibold text-foreground text-sm">No Incident Selected</h3>
        <p className="text-xs max-w-xs mt-1 text-muted-foreground">
          Select an active distress signal from the incident queue to view telemetry, medical history, and coordinate rescue resources.
        </p>
      </div>
    );
  }

  // Calculate live elapsed time from state-tracked timestamp
  const eventTime = new Date(event.createdAt).getTime();
  const elapsedSec = Math.max(0, Math.floor(((now || eventTime) - eventTime) / 1000));
  const elapsedMinutes = Math.floor(elapsedSec / 60);
  const elapsedHours = Math.floor(elapsedMinutes / 60);
  const elapsedDisplay =
    elapsedHours > 0
      ? `${elapsedHours}h ${elapsedMinutes % 60}m ${elapsedSec % 60}s`
      : `${elapsedMinutes}m ${elapsedSec % 60}s`;

  // Nearest emergency resources
  const nearestResources =
    event.lat && event.lng
      ? getNearestResources(event.lat, event.lng, event.category, event.altM, 5)
      : [];

  const handleCopyCoords = () => {
    if (!event.lat || !event.lng) return;
    const text = `${event.lat.toFixed(4)}N ${event.lng.toFixed(4)}E alt ${event.altM ?? "unknown"}m`;
    navigator.clipboard.writeText(text);
    setCopiedCoords(true);
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  const handleResolveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveNote.trim()) return;
    setIsSubmitting(true);
    try {
      await onResolve(event.id, resolveNote.trim());
      setResolveOpen(false);
      setResolveNote("");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col bg-background overflow-y-auto border-l border-border">
      {/* Header Banner */}
      <div className="p-4 border-b border-border bg-muted/20 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  event.status === "open"
                    ? "bg-red-500/20 text-red-400 border border-red-500/30"
                    : event.status === "acknowledged"
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                }`}
              >
                {event.status.toUpperCase()}
              </span>

              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-muted text-muted-foreground uppercase border border-border">
                {event.channel}
              </span>
            </div>

            <h2 className="text-base font-bold text-foreground">
              {event.trekkerName || "Solo Trekker"}
            </h2>
            <p className="text-xs text-muted-foreground">
              {event.routeName || "Khumbu Trail"} · SOS ID:{" "}
              <span className="font-mono">{event.id.slice(0, 8)}</span>
            </p>
          </div>

          {/* Time since tap */}
          <div className="text-right">
            <div className="text-xs font-mono font-bold text-orange-400 flex items-center justify-end gap-1">
              <Clock className="h-3 w-3 animate-pulse" />
              {elapsedDisplay}
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">
              Tapped at {formatNepalTime(event.createdAt)} NPT
            </div>
          </div>
        </div>

        {/* Note if provided */}
        {event.note && (
          <div className="p-2.5 rounded-lg bg-background border border-border/80 text-xs">
            <span className="font-semibold text-foreground/80 block mb-0.5">
              Trekker Situation Note:
            </span>
            <p className="italic text-foreground/90">&quot;{event.note}&quot;</p>
          </div>
        )}
      </div>

      <div className="p-4 space-y-5 flex-1">
        {/* Telemetry / Coordinates Card */}
        <div className="p-3.5 rounded-xl border border-border bg-muted/15 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-accent" />
              GPS Coordinates & Elevation
            </span>
            <button
              onClick={handleCopyCoords}
              className="text-[11px] font-mono flex items-center gap-1 text-accent hover:underline cursor-pointer"
            >
              {copiedCoords ? (
                <>
                  <Check className="h-3 w-3 text-emerald-400" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3" />
                  Copy Coords
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 rounded-lg bg-background border border-border">
              <span className="text-[10px] text-muted-foreground block">
                Position
              </span>
              <span className="font-mono font-medium text-foreground">
                {event.lat?.toFixed(4)}°N, {event.lng?.toFixed(4)}°E
              </span>
            </div>
            <div className="p-2 rounded-lg bg-background border border-border">
              <span className="text-[10px] text-muted-foreground block">
                Altitude
              </span>
              <span className="font-mono font-bold text-foreground">
                {event.altM ? formatAltitude(event.altM) : "Unknown"}
              </span>
              {event.accuracyM && (
                <span className="text-[10px] font-mono text-muted-foreground ml-1">
                  (±{Math.round(event.accuracyM)}m)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="p-3 rounded-xl border border-border bg-muted/15">
          <span className="text-xs font-semibold text-foreground block mb-2">
            Emergency Contact
          </span>
          {emergencyContact?.phone ? (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-foreground">
                  {emergencyContact.name || "Designated Contact"}
                </p>
                <p className="text-xs font-mono text-muted-foreground">
                  {emergencyContact.phone}
                </p>
              </div>
              <a
                href={`tel:${emergencyContact.phone}`}
                className="h-8 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                Call
              </a>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground italic">
              No emergency contact registered in trekker profile.
            </p>
          )}
        </div>

        {/* Check-in History & Altitude Trend */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-accent" />
              Recent Check-ins & AMS Trend
            </h4>
            <span className="text-[11px] font-mono text-muted-foreground">
              Last {checkins.length} check-ins
            </span>
          </div>

          {checkins.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 rounded-lg border border-border/60 bg-muted/10">
              No check-ins logged for this trek yet.
            </p>
          ) : (
            <div className="space-y-1.5">
              {checkins.slice(0, 3).map((c) => (
                <div
                  key={c.id}
                  className="p-2.5 rounded-lg border border-border/70 bg-background flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">
                        LLS: {c.lls}/12
                      </span>
                      {c.sleepAltM && (
                        <span className="font-mono text-[11px] text-muted-foreground">
                          Sleep: {formatAltitude(c.sleepAltM)}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      H:{c.headache} · G:{c.gi} · F:{c.fatigue} · D:{c.dizziness}
                      {c.redFlags.length > 0 && (
                        <span className="text-red-400 font-bold ml-1.5">
                          Red Flags: {c.redFlags.join(", ")}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-muted-foreground">
                    {formatNepalTime(c.recordedAt)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Nearest Emergency Resources */}
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-foreground flex items-center gap-1.5">
            <AlertOctagon className="h-3.5 w-3.5 text-orange-400" />
            Nearest Emergency Facilities & Rescue
          </h4>

          <div className="space-y-1.5">
            {nearestResources.map((res) => (
              <div
                key={res.id}
                className="p-2.5 rounded-lg border border-border bg-background flex items-center justify-between text-xs"
              >
                <div className="max-w-[210px]">
                  <div className="font-medium text-foreground truncate">
                    {res.name}
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground">
                    {res.distanceKm.toFixed(1)} km away
                    {res.altM ? ` · ${formatAltitude(res.altM)}` : ""}
                  </div>
                </div>

                {res.phone ? (
                  <a
                    href={`tel:${res.phone}`}
                    className="h-7 px-2.5 rounded bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium flex items-center gap-1 border border-border"
                  >
                    <Phone className="h-3 w-3 text-emerald-400" />
                    Call
                  </a>
                ) : (
                  <span className="text-[10px] text-muted-foreground px-2 py-1 rounded bg-muted/30">
                    No phone
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Action Footer: Acknowledge and Resolve Buttons */}
      <div className="p-4 border-t border-border bg-muted/20 space-y-2">
        {event.status === "open" && (
          <button
            onClick={() => onAcknowledge(event.id)}
            className="w-full h-11 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
          >
            <ShieldCheck className="h-4 w-4" />
            Acknowledge Emergency SOS
          </button>
        )}

        {event.status !== "resolved" && (
          <button
            onClick={() => setResolveOpen(true)}
            className="w-full h-10 rounded-lg border border-border bg-background hover:bg-muted text-foreground font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            Mark SOS as Resolved
          </button>
        )}

        {event.status === "resolved" && (
          <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs text-center font-medium">
            ✓ Incident resolved and logged in coordinator archive.
          </div>
        )}
      </div>

      {/* Resolution Modal */}
      {resolveOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-xl bg-background border border-border p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-foreground">
                Resolve Incident #{event.id.slice(0, 8)}
              </h3>
              <button
                onClick={() => setResolveOpen(false)}
                className="text-muted-foreground hover:text-foreground cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResolveSubmit} className="space-y-3">
              <p className="text-xs text-muted-foreground">
                Provide an official coordinator resolution note for the incident log (e.g. &quot;Trekker safely escorted to Pheriche HRA clinic by guide&quot;).
              </p>

              <textarea
                value={resolveNote}
                onChange={(e) => setResolveNote(e.target.value)}
                maxLength={500}
                required
                rows={3}
                placeholder="Enter resolution notes..."
                className="w-full rounded-lg border border-border bg-muted/20 p-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setResolveOpen(false)}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border hover:bg-muted text-foreground cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !resolveNote.trim()}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white cursor-pointer"
                >
                  {isSubmitting ? "Resolving..." : "Confirm Resolution"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
