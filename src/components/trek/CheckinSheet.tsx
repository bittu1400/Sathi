"use client";

import * as React from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { LakeLouiseForm, type LakeLouiseScores } from "./LakeLouiseForm";
import { RedFlagList } from "./RedFlagList";
import { SleepPicker } from "./SleepPicker";
import { AmsResultCard } from "./AmsResultCard";
import { Button } from "../ui/button";
import { useDiscardGuard } from "../ui/discard-guard";
import { Progress } from "../ui/spinner";
import { SaveState } from "../ui/save-state";
import { Sheet, SheetContent } from "../ui/sheet";
import { useSos } from "../sos/SosProvider";
import { recordCheckin } from "@/lib/trek-log";
import { isOnline } from "@/lib/offline/status";
import { newId } from "@/lib/id";
import type { AmsResult, RedFlag, RouteDetail } from "@/lib/types";

export interface CheckinSheetProps {
  route: RouteDetail;
  trekId: string;
  /** Pre-selected "tonight I sleep at" waypoint. */
  defaultSleepWaypointId: string;
  onClose: () => void;
}

type Step = "form" | "redflags" | "sleep" | "result";
const STEP_NUMBER = { form: 1, redflags: 2, sleep: 3 } as const;

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
  const [queued, setQueued] = React.useState(false);

  const dirty = step !== "result" && (Object.values(scores).some(Boolean) || redFlags.length > 0 || sleepId !== defaultSleepWaypointId);
  const { guard, dialog } = useDiscardGuard(dirty);

  const sendSos = () => {
    onClose();
    sos.open("altitude_illness");
  };

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
      setQueued(!isOnline());
      setResult(saved);
      setStep("result");
    } catch {
      setError("Couldn't save the check-in on this device. Try again.");
    } finally {
      setSaving(false);
    }
  };

  const number = step === "result" ? 3 : STEP_NUMBER[step];

  return (
    <>
      <Sheet open onOpenChange={(open) => !open && guard(onClose)}>
        <SheetContent title={step === "result" ? "Your check-in result" : "Evening check-in"} description={step === "result" ? undefined : `Step ${number} of 3`}>
          {step !== "result" && <Progress value={(number / 3) * 100} valueText={`Step ${number} of 3`} className="mb-5" />}

          <div className="flex-1 space-y-6">
            {step === "form" && <LakeLouiseForm scores={scores} onChange={setScores} />}
            {step === "redflags" && <RedFlagList selectedFlags={redFlags} onChange={setRedFlags} onSendSos={sendSos} />}
            {step === "sleep" && <SleepPicker waypoints={route.waypoints} selectedWaypointId={sleepId} onChange={setSleepId} />}
            {step === "result" && result && (
              <div aria-live="polite" className="space-y-3">
                <AmsResultCard result={result} onTriggerSos={sendSos} />
                <SaveState state={queued ? "queued" : "saved"} />
              </div>
            )}
            {error && (
              <p role="alert" className="text-body text-danger">
                {error}
              </p>
            )}
          </div>

          <div className="mt-6 flex items-center justify-between gap-3 border-t border-line pt-4">
            {step === "result" ? (
              <Button className="w-full" onClick={onClose}>
                Back to trek
              </Button>
            ) : (
              <>
                {step === "form" ? (
                  <span />
                ) : (
                  <Button variant="ghost" onClick={() => setStep(step === "sleep" ? "redflags" : "form")}>
                    <ArrowLeft className="size-4" aria-hidden /> Back
                  </Button>
                )}
                {step === "sleep" ? (
                  <Button state={saving ? "busy" : "idle"} onClick={submit}>
                    <Check className="size-4" aria-hidden /> Save check-in
                  </Button>
                ) : (
                  <Button onClick={() => setStep(step === "form" ? "redflags" : "sleep")}>
                    Next <ArrowRight className="size-4" aria-hidden />
                  </Button>
                )}
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
      {dialog}
    </>
  );
}
