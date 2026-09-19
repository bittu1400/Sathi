"use client";

import * as React from "react";
import { LakeLouiseForm, LakeLouiseScores } from "./LakeLouiseForm";
import { RedFlagList } from "./RedFlagList";
import { SleepPicker } from "./SleepPicker";
import { AmsResultCard } from "./AmsResultCard";
import { Button } from "../ui/button";
import { Waypoint, RedFlag } from "@/lib/types";
import { X, ArrowRight, ArrowLeft, Check } from "lucide-react";

export interface CheckinSheetProps {
  isOpen: boolean;
  onClose: () => void;
  waypoints: Waypoint[];
}

export function CheckinSheet({ isOpen, onClose, waypoints }: CheckinSheetProps) {
  const [step, setStep] = React.useState<"form" | "redflags" | "sleep" | "result">("form");
  const [scores, setScores] = React.useState<LakeLouiseScores>({
    headache: 0,
    gi: 0,
    fatigue: 0,
    dizziness: 0,
  });
  const [selectedFlags, setSelectedFlags] = React.useState<RedFlag[]>([]);
  const [selectedSleepId, setSelectedSleepId] = React.useState<string>(
    waypoints[0]?.id || "ebc-lobuche"
  );
  const [sleepAltM, setSleepAltM] = React.useState<number>(
    waypoints[0]?.altM || 4940
  );

  if (!isOpen) return null;

  const totalLls =
    scores.headache + scores.gi + scores.fatigue + scores.dizziness;
  const hasAms = scores.headache >= 1 && totalLls >= 3;
  const hasRedFlags = selectedFlags.length > 0;

  let severity: "ok" | "info" | "caution" | "warning" | "danger" = "ok";
  let headline = "No warning signs right now. Keep ascending gradually.";
  let reasons: string[] = [`Planned sleeping altitude: ${sleepAltM.toLocaleString()} m`];
  let actions: string[] = [
    "Continue ascending gradually",
    "Stay hydrated and eat well",
    "Check in again tomorrow evening",
  ];

  if (hasRedFlags) {
    severity = "danger";
    headline = "Descend now. Do not go higher.";
    reasons = [
      `Red flags detected: ${selectedFlags.join(", ")}`,
      `Planned sleeping altitude: ${sleepAltM.toLocaleString()} m`,
      "Possible HACE or HAPE complication.",
    ];
    actions = [
      "Start descending with a companion right away",
      "Do not stay alone. Tell your guide or teahouse owner",
      "Use SOS to alert coordination",
    ];
  } else if (totalLls >= 10 && hasAms) {
    severity = "danger";
    headline = "Descend now. Severe AMS present.";
    reasons = [`Total Lake Louise Score: ${totalLls}`, `Sleeping altitude: ${sleepAltM.toLocaleString()} m`];
    actions = ["Descend at least 300–1,000m immediately"];
  } else if (totalLls >= 6 && hasAms) {
    severity = "warning";
    headline = "Do not go higher today.";
    reasons = [`Moderate AMS present (LLS ${totalLls})`, `Sleeping altitude: ${sleepAltM.toLocaleString()} m`];
    actions = ["Rest at this altitude", "Do not ascend until symptoms clear"];
  } else if (totalLls >= 3 && hasAms) {
    severity = "caution";
    headline = "Take it easy. Don't ascend further today.";
    reasons = [`Mild AMS present (LLS ${totalLls})`, `Sleeping altitude: ${sleepAltM.toLocaleString()} m`];
    actions = ["Rest and reassess", "Drink fluids and eat"];
  }

  return (
    <div className="fixed inset-0 z-50 bg-bg/80 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-surface border border-border w-full max-w-lg h-[90vh] sm:h-auto max-h-[90vh] rounded-t-[var(--radius-lg)] sm:rounded-[var(--radius-lg)] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-border flex items-center justify-between bg-surface-2/60">
          <div className="flex items-center gap-2">
            {step !== "form" && step !== "result" && (
              <button
                type="button"
                onClick={() =>
                  setStep(
                    step === "sleep"
                      ? "redflags"
                      : step === "redflags"
                      ? "form"
                      : "form"
                  )
                }
                className="p-1 rounded-lg text-text-muted hover:text-text"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <h3 className="font-bold text-base text-text">
              {step === "result" ? "AMS Assessment Result" : "Evening AMS Check-in"}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg border border-border text-text-muted hover:text-text"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {step === "form" && (
            <LakeLouiseForm scores={scores} onChange={setScores} />
          )}

          {step === "redflags" && (
            <RedFlagList
              selectedFlags={selectedFlags}
              onChange={setSelectedFlags}
            />
          )}

          {step === "sleep" && (
            <SleepPicker
              waypoints={waypoints}
              selectedWaypointId={selectedSleepId}
              onChange={(id, alt) => {
                setSelectedSleepId(id);
                setSleepAltM(alt);
              }}
            />
          )}

          {step === "result" && (
            <AmsResultCard
              severity={severity}
              headline={headline}
              reasons={reasons}
              actions={actions}
            />
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-border bg-surface-2/60 flex items-center justify-between">
          {step !== "result" ? (
            <>
              <span className="text-xs font-mono text-text-muted">
                Step {step === "form" ? "1/3" : step === "redflags" ? "2/3" : "3/3"}
              </span>

              {step === "sleep" ? (
                <Button variant="primary" onClick={() => setStep("result")}>
                  <Check className="w-4 h-4 mr-1.5" />
                  Submit Assessment
                </Button>
              ) : (
                <Button
                  variant="primary"
                  onClick={() =>
                    setStep(step === "form" ? "redflags" : "sleep")
                  }
                >
                  Next
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </Button>
              )}
            </>
          ) : (
            <Button variant="primary" className="w-full" onClick={onClose}>
              Done & Save Check-in
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
