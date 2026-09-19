import type {
  AlertKind,
  AmsInput,
  AmsResult,
  RedFlag,
  Severity,
} from "@/lib/types";
import {
  DANGER_ACTIONS,
  DANGER_HEADLINE,
  GAIN_CAUTION_ACTIONS,
  GAIN_CAUTION_HEADLINE,
  MILD_HEADACHE_INFO,
  OK_MESSAGE,
  RED_FLAG_LABELS,
  REST_DAY_BODY,
  REST_DAY_HEADLINE,
  SYMPTOM_CAUTION_ACTIONS,
  SYMPTOM_CAUTION_HEADLINE,
  WARNING_ACTIONS,
  WARNING_HEADLINE,
  gainCautionBody,
} from "@/lib/ams-copy";

type Alert = AmsResult["alerts"][number];

const severityRank: Record<Severity | "ok", number> = {
  ok: 0,
  info: 1,
  caution: 2,
  warning: 3,
  danger: 4,
};

const alertSeverity = (
  severity: Severity,
  kind: AlertKind,
  title: string,
  body: string,
  actions: string[],
  date: string,
): Alert => ({
  kind,
  severity,
  title,
  body,
  actions,
  dedupeKey: `${kind}:${date}`,
});

const localDate = (input: AmsInput): string =>
  input.latest?.recordedAt.slice(0, 10) ??
  input.sleepAltitudes.at(-1)?.date.slice(0, 10) ??
  new Date().toISOString().slice(0, 10);

const totalScore = (checkin: AmsInput["latest"]): number =>
  checkin === null
    ? 0
    : checkin.headache + checkin.gi + checkin.fatigue + checkin.dizziness;

const hasAms = (checkin: AmsInput["latest"], total: number): boolean =>
  checkin !== null && checkin.headache >= 1 && total >= 3;

const latestAltitude = (input: AmsInput): number | null =>
  input.sleepAltitudes.at(-1)?.altM ?? null;

const previousAltitude = (input: AmsInput): number | null =>
  input.sleepAltitudes.at(-2)?.altM ?? null;

const altitudeGains = (input: AmsInput): number[] => {
  const gains: number[] = [];
  let previous = input.startAltM;

  for (const night of input.sleepAltitudes) {
    gains.push(night.altM - previous);
    previous = night.altM;
  }

  return gains;
};

const hasThreeConsecutiveGains = (input: AmsInput): boolean => {
  let consecutive = 0;

  for (const [index, gain] of altitudeGains(input).entries()) {
    const altitude = input.sleepAltitudes[index]?.altM;
    if (altitude !== undefined && altitude > 3000 && gain > 0) {
      consecutive += 1;
      if (consecutive >= 3) {
        return true;
      }
    } else {
      consecutive = 0;
    }
  }

  return false;
};

const pushAlert = (
  alerts: Alert[],
  level: Severity,
  kind: AlertKind,
  title: string,
  body: string,
  actions: string[],
  date: string,
) => {
  const alert = alertSeverity(level, kind, title, body, actions, date);
  if (!alerts.some((existing) => existing.dedupeKey === alert.dedupeKey)) {
    alerts.push(alert);
  }
};

export function evaluateAms(input: AmsInput): AmsResult {
  const date = localDate(input);
  const alerts: Alert[] = [];
  const reasons: string[] = [];
  let level: AmsResult["level"] = "ok";
  let headline = OK_MESSAGE;
  let actions: string[] = [];

  const applyLevel = (
    nextLevel: AmsResult["level"],
    nextHeadline: string,
    nextActions: string[],
  ) => {
    if (severityRank[nextLevel] > severityRank[level]) {
      level = nextLevel;
      headline = nextHeadline;
      actions = nextActions;
    }
  };

  const latest = input.latest;
  const total = totalScore(latest);
  const previousTotal = totalScore(input.previous);
  const currentAltitude = latestAltitude(input);
  const priorAltitude = previousAltitude(input);
  const ams = hasAms(latest, total);

  if (latest?.redFlags.length) {
    applyLevel("danger", DANGER_HEADLINE, DANGER_ACTIONS);
    for (const flag of latest.redFlags) {
      reasons.push(RED_FLAG_LABELS[flag as RedFlag]);
    }
    pushAlert(
      alerts,
      "danger",
      "ams_red_flag",
      DANGER_HEADLINE,
      "",
      DANGER_ACTIONS,
      date,
    );
  }

  if (ams && total >= 10) {
    applyLevel("danger", DANGER_HEADLINE, DANGER_ACTIONS);
    reasons.push(`LLS ${total}`);
    pushAlert(
      alerts,
      "danger",
      "ams_symptoms",
      DANGER_HEADLINE,
      "",
      DANGER_ACTIONS,
      date,
    );
  }

  if (ams && total >= 6 && total <= 9) {
    applyLevel("warning", WARNING_HEADLINE, WARNING_ACTIONS);
    reasons.push(`LLS ${total}`);
    pushAlert(
      alerts,
      "warning",
      "ams_symptoms",
      WARNING_HEADLINE,
      "",
      WARNING_ACTIONS,
      date,
    );
  }

  if (
    ams &&
    total >= 3 &&
    total <= 5 &&
    input.previous !== null &&
    previousTotal < total &&
    currentAltitude !== null &&
    priorAltitude !== null &&
    currentAltitude >= priorAltitude
  ) {
    applyLevel("warning", WARNING_HEADLINE, WARNING_ACTIONS);
    reasons.push(`LLS ${total}`);
    pushAlert(
      alerts,
      "warning",
      "ams_symptoms",
      WARNING_HEADLINE,
      "",
      WARNING_ACTIONS,
      date,
    );
  }

  if (ams && total >= 3 && total <= 5) {
    applyLevel(
      "caution",
      SYMPTOM_CAUTION_HEADLINE,
      SYMPTOM_CAUTION_ACTIONS,
    );
    reasons.push(`LLS ${total}`);
    pushAlert(
      alerts,
      "caution",
      "ams_symptoms",
      SYMPTOM_CAUTION_HEADLINE,
      "",
      SYMPTOM_CAUTION_ACTIONS,
      date,
    );
  }

  const tonight = latestAltitude(input);
  const lastNight = input.sleepAltitudes.length
    ? input.sleepAltitudes.length === 1
      ? input.startAltM
      : input.sleepAltitudes.at(-2)!.altM
    : null;
  const gain = tonight === null || lastNight === null ? null : tonight - lastNight;

  if (tonight !== null && gain !== null && tonight > 3000 && gain > 500) {
    const body = gainCautionBody(gain);
    applyLevel("caution", GAIN_CAUTION_HEADLINE, GAIN_CAUTION_ACTIONS);
    reasons.push(body);
    pushAlert(
      alerts,
      "caution",
      "ams_gain",
      GAIN_CAUTION_HEADLINE,
      body,
      GAIN_CAUTION_ACTIONS,
      date,
    );
  }

  if (hasThreeConsecutiveGains(input)) {
    applyLevel("info", REST_DAY_HEADLINE, []);
    reasons.push(REST_DAY_BODY);
    pushAlert(
      alerts,
      "info",
      "ams_rest_day",
      REST_DAY_HEADLINE,
      REST_DAY_BODY,
      [],
      date,
    );
  }

  if (latest !== null && latest.headache >= 1 && latest.headache <= 3 && total < 3) {
    applyLevel("info", MILD_HEADACHE_INFO, []);
    reasons.push(MILD_HEADACHE_INFO);
  }

  return { level, headline, actions, reasons, alerts };
}
