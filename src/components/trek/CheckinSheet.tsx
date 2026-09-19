"use client";

import * as React from "react";
import { LakeLouiseForm, LakeLouiseScores } from "./LakeLouiseForm";
import { RedFlagList } from "./RedFlagList";
import { SleepPicker } from "./SleepPicker";
import { AmsResultCard } from "./AmsResultCard";
import { Button } from "../ui/button";
import { useSos } from "../sos/SosProvider";
import { recordCheckin } from "@/lib/trek-log";
import { newId } from "@/lib/id";
import type { AmsResult, RedFlag, RouteDetail } from "@/lib/types";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";

export interface CheckinSheetProps {
  route: RouteDetail;
  trekId: string;
  /** Pre-selected "tonight I sleep at" waypoint. */
  defaultSleepWaypointId: string;
  onClose: () => void;
}

type Step = "form" | "redflags" | "sleep" | "result";
const STEP_LABEL: Record<Exclude<Step, "result">, string> = { form: "1/3", redflags: "2/3", sleep: "3/3" };

/** Evening check-in (SPEC A-07). The verdict comes only from evaluateAms(). Mounted while open. */
export function CheckinSheet({ route, trekId, defaultSleepWaypointId, onClose }: CheckinSheetProps) {
  const sos = useSos();
  const [step, setStep] = React.useState<Step>("form");
  const [scores, setScores] = React.useState<LakeLouiseScores>({ headache: 0, gi: 0, fatigue: 0, dizziness: 0 });
  const [redFlags, setRedFlags] = React.useState<RedFlag[]>([]);
  const [sleepId, setSleepId] = React.useState(defaultSleepWaypointId);
  const [result, setResult] = React.useState<AmsResult | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const submit = async () => {
    const sleep = route.waypoints.find((w) => w.id === sleepId) ?? null;
    setSaving(true);
    setError(null);
    try {
      const saved = await recordCheckin(route, {
        id: newId(),
        trekId,
        recordedAt: new Date().toISOString(),
        ...scores,
        redFlags,
        sleepWaypointId: sleep?.id ?? null,
        sleepAltM: sleep?.altM ?? null,
        lls: scores.headache + scores.gi + scores.fatigue + scores.dizziness,
      });
      setResult(saved);
      setStep("result");
    } catch {
      setError("Couldn't save the check-in on this device. Try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-bg/80 p-0 backdrop-blur-md sm:items-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="checkin-title"
        className="flex h-[90vh] max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-t-[var(--radius-lg)] border border-border bg-surface shadow-2xl sm:h-auto sm:rounded-[var(--radius-lg)]"
      >
        <div className="flex items-center justify-between border-b border-border bg-surface-2/60 p-3">
          <div className="flex items-center gap-1">
            {(step === "redflags" || step === "sleep") && (
              <button
                type="button"
                aria-label="Back"
                onClick={() => setStep(step === "sleep" ? "redflags" : "form")}
                className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] text-text-muted hover:text-text"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}
            <h2 id="checkin-title" className="px-2 text-base font-bold text-text">
              {step === "result" ? "Your check-in result" : "Evening check-in"}
            </h2>
          </div>
          <button
            type="button"
            aria-label="Close check-in"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-sm)] border border-border text-text-muted hover:text-text"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-4 sm:p-6" aria-live="polite">
          {step === "form" && <LakeLouiseForm scores={scores} onChange={setScores} />}
          {step === "redflags" && <RedFlagList selectedFlags={redFlags} onChange={setRedFlags} />}
          {step === "sleep" && (
            <SleepPicker waypoints={route.waypoints} selectedWaypointId={sleepId} onChange={(id) => setSleepId(id)} />
          )}
          {step === "result" && result && (
            <AmsResultCard
              result={result}
              onTriggerSos={() => {
                onClose();
                sos.open("altitude_illness");
              }}
            />
          )}
          {error && (
            <p role="alert" className="text-sm text-danger">
              {error}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border bg-surface-2/60 p-4">
          {step === "result" ? (
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done
            </Button>
          ) : (
            <>
              <span className="font-mono text-xs text-text-muted">Step {STEP_LABEL[step]}</span>
              {step === "sleep" ? (
                <Button variant="primary" onClick={submit} loading={saving}>
                  <Check className="mr-1.5 h-4 w-4" />
                  Save check-in
                </Button>
              ) : (
                <Button variant="primary" onClick={() => setStep(step === "form" ? "redflags" : "sleep")}>
                  Next
                  <ArrowRight className="ml-1.5 h-4 w-4" />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
