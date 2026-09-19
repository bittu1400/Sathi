import { describe, expect, it } from "vitest";

import { amsInputFromCheckins, evaluateAms } from "@/lib/ams";
import type { AmsInput, RedFlag } from "@/lib/types";

const checkin = (
  scores: Partial<{
    headache: 0 | 1 | 2 | 3;
    gi: 0 | 1 | 2 | 3;
    fatigue: 0 | 1 | 2 | 3;
    dizziness: 0 | 1 | 2 | 3;
  }> = {},
  redFlags: RedFlag[] = [],
): NonNullable<AmsInput["latest"]> => ({
  headache: scores.headache ?? 0,
  gi: scores.gi ?? 0,
  fatigue: scores.fatigue ?? 0,
  dizziness: scores.dizziness ?? 0,
  redFlags,
  recordedAt: "2026-09-19T12:00:00Z",
});

const input = (overrides: Partial<AmsInput> = {}): AmsInput => ({
  startAltM: 2860,
  sleepAltitudes: [{ date: "2026-09-19", altM: 3440 }],
  latest: null,
  previous: null,
  ...overrides,
});

describe("evaluateAms", () => {
  it.each<RedFlag>([
    "confusion",
    "ataxia",
    "breathless_at_rest",
    "wet_cough",
    "severe_headache_unrelieved",
  ])("R1 treats %s as danger", (redFlag) => {
    const result = evaluateAms(input({ latest: checkin({}, [redFlag]) }));
    expect(result.level).toBe("danger");
    expect(result.alerts[0]?.kind).toBe("ams_red_flag");
  });

  it("R2 returns danger for severe AMS", () => {
    const result = evaluateAms(
      input({ latest: checkin({ headache: 3, gi: 3, fatigue: 3, dizziness: 3 }) }),
    );
    expect(result.level).toBe("danger");
  });

  it.each([
    [3, { headache: 1, gi: 2 }],
    [5, { headache: 1, gi: 3, fatigue: 1 }],
    [6, { headache: 1, gi: 3, fatigue: 2 }],
    [9, { headache: 1, gi: 3, fatigue: 3, dizziness: 2 }],
    [10, { headache: 1, gi: 3, fatigue: 3, dizziness: 3 }],
    [12, { headache: 3, gi: 3, fatigue: 3, dizziness: 3 }],
  ] as const)("covers LLS boundary %s", (total, scores) => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [{ date: "2026-09-19", altM: 2860 }],
        latest: checkin(scores),
      }),
    );
    expect(result.level).toBe(total >= 10 ? "danger" : total >= 6 ? "warning" : "caution");
  });

  it("does not classify a score below 3 as AMS", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [{ date: "2026-09-19", altM: 2860 }],
        latest: checkin({ headache: 1, gi: 1 }),
      }),
    );
    expect(result.level).toBe("info");
    expect(result.alerts).toHaveLength(0);
  });

  it("R4 warns when mild AMS worsens at the same or higher altitude", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-18", altM: 3440 },
          { date: "2026-09-19", altM: 3860 },
        ],
        previous: checkin({ headache: 1, gi: 1 }),
        latest: checkin({ headache: 1, gi: 1, fatigue: 1 }),
      }),
    );
    expect(result.level).toBe("warning");
  });

  it("does not apply R4 without a previous check-in", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-18", altM: 3440 },
          { date: "2026-09-19", altM: 3860 },
        ],
        previous: null,
        latest: checkin({ headache: 1, gi: 1, fatigue: 1 }),
      }),
    );
    expect(result.level).toBe("caution");
    expect(result.alerts).toHaveLength(1);
    expect(result.alerts[0]?.severity).toBe("caution");
  });

  it("returns one warning alert when R4 and R5 both match", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-18", altM: 3440 },
          { date: "2026-09-19", altM: 3860 },
        ],
        previous: checkin({ headache: 1, gi: 1 }),
        latest: checkin({ headache: 1, gi: 1, fatigue: 1 }),
      }),
    );
    const symptomAlerts = result.alerts.filter(
      (alert) => alert.kind === "ams_symptoms",
    );
    expect(symptomAlerts).toHaveLength(1);
    expect(symptomAlerts[0]?.severity).toBe("warning");
    expect(new Set(result.alerts.map((alert) => alert.dedupeKey)).size).toBe(
      result.alerts.length,
    );
  });

  it("R5 returns symptom caution for mild AMS", () => {
    const result = evaluateAms(input({ latest: checkin({ headache: 1, gi: 1, fatigue: 1 }) }));
    expect(result.level).toBe("caution");
  });

  it("R6 uses startAltM for a single-night comparison", () => {
    const result = evaluateAms(
      input({ startAltM: 2860, sleepAltitudes: [{ date: "2026-09-19", altM: 3440 }] }),
    );
    expect(result.alerts.map((alert) => alert.kind)).toContain("ams_gain");
  });

  it("does not trigger R6 at exactly 500 m", () => {
    const result = evaluateAms(
      input({ startAltM: 3000, sleepAltitudes: [{ date: "2026-09-19", altM: 3500 }] }),
    );
    expect(result.alerts.map((alert) => alert.kind)).not.toContain("ams_gain");
  });

  it("triggers R6 above 500 m and matches the Dingboche to Lobuche demo", () => {
    const result = evaluateAms(
      input({ startAltM: 4410, sleepAltitudes: [{ date: "2026-09-19", altM: 4940 }] }),
    );
    expect(result.level).toBe("caution");
    expect(result.alerts[0]?.body).toContain("530 m");
  });

  it("does not trigger R6 on descent", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-18", altM: 4000 },
          { date: "2026-09-19", altM: 3500 },
        ],
      }),
    );
    expect(result.alerts.map((alert) => alert.kind)).not.toContain("ams_gain");
  });

  it("R7 detects three consecutive positive gains", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-16", altM: 3100 },
          { date: "2026-09-17", altM: 3200 },
          { date: "2026-09-18", altM: 3300 },
          { date: "2026-09-19", altM: 3400 },
        ],
      }),
    );
    expect(result.alerts.map((alert) => alert.kind)).toContain("ams_rest_day");
  });

  it("counts a descent as a rest night for R7", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-16", altM: 3100 },
          { date: "2026-09-17", altM: 3200 },
          { date: "2026-09-18", altM: 3000 },
          { date: "2026-09-19", altM: 3100 },
          { date: "2026-09-20", altM: 3200 },
        ],
      }),
    );
    expect(result.alerts.map((alert) => alert.kind)).not.toContain("ams_rest_day");
  });

  it("does not trigger R6 or R7 at or below 3000 m", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [
          { date: "2026-09-17", altM: 2000 },
          { date: "2026-09-18", altM: 2500 },
          { date: "2026-09-19", altM: 3000 },
        ],
      }),
    );
    expect(result.alerts).toHaveLength(0);
  });

  it("R8 returns info for headache without AMS", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [{ date: "2026-09-19", altM: 2860 }],
        latest: checkin({ headache: 1 }),
      }),
    );
    expect(result.level).toBe("info");
    expect(result.headline).toContain("Mild headache");
    expect(result.alerts).toHaveLength(0);
  });

  it("returns ok when no rule applies", () => {
    const result = evaluateAms(input({ sleepAltitudes: [{ date: "2026-09-19", altM: 2860 }] }));
    expect(result.level).toBe("ok");
    expect(result.headline).toContain("No warning signs");
  });

  it("handles an empty sleep-altitude history", () => {
    const result = evaluateAms(input({ sleepAltitudes: [] }));
    expect(result.level).toBe("ok");
  });

  it("keeps the highest severity while collecting all applicable alerts", () => {
    const result = evaluateAms(
      input({
        sleepAltitudes: [{ date: "2026-09-19", altM: 4000 }],
        latest: checkin({ headache: 2, gi: 2 }, ["ataxia"]),
      }),
    );
    expect(result.level).toBe("danger");
    expect(result.alerts.map((alert) => alert.kind)).toEqual([
      "ams_red_flag",
      "ams_symptoms",
      "ams_gain",
    ]);
    expect(result.reasons.length).toBeGreaterThanOrEqual(3);
  });

  it("uses the documented warning text for LLS 7 with headache 2", () => {
    const result = evaluateAms(
      input({ latest: checkin({ headache: 2, gi: 2, fatigue: 2, dizziness: 1 }) }),
    );
    expect(result.level).toBe("warning");
    expect(result.headline).toBe("Do not go higher today.");
  });
});

describe("same-day escalation", () => {
  it("gives caution, warning and danger different dedupe keys on one day", () => {
    const keys = [
      checkin({ headache: 1, gi: 2 }),
      checkin({ headache: 2, gi: 2, fatigue: 2 }),
      checkin({ headache: 3, gi: 3, fatigue: 2, dizziness: 2 }),
    ].map(
      (latest) =>
        evaluateAms(input({ latest })).alerts.find(
          (alert) => alert.kind === "ams_symptoms",
        )?.dedupeKey,
    );
    expect(keys).toEqual([
      "ams_symptoms:caution:2026-09-19",
      "ams_symptoms:warning:2026-09-19",
      "ams_symptoms:danger:2026-09-19",
    ]);
  });

  it("uses the Nepal calendar day for the key", () => {
    // 20:00 UTC on the 19th is 01:45 on the 20th in Kathmandu.
    const latest = { ...checkin({ headache: 1, gi: 2 }), recordedAt: "2026-09-19T20:00:00Z" };
    expect(evaluateAms(input({ latest })).alerts[0]?.dedupeKey).toBe(
      "ams_symptoms:caution:2026-09-20",
    );
  });
});

describe("amsInputFromCheckins", () => {
  const c = (recordedAt: string, sleepAltM: number | null, headache: 0 | 1 | 2 | 3 = 0) => ({
    id: recordedAt,
    trekId: "t",
    recordedAt,
    headache,
    gi: 0 as const,
    fatigue: 0 as const,
    dizziness: 0 as const,
    redFlags: [],
    sleepWaypointId: null,
    sleepAltM,
    lls: headache,
  });

  it("keeps the last sleep altitude per Nepal day and orders latest/previous", () => {
    const input = amsInputFromCheckins(2860, [
      c("2026-09-19T13:00:00Z", 4410, 1), // 18:45 NPT on the 19th
      c("2026-09-18T13:00:00Z", 3860),
      c("2026-09-19T15:00:00Z", 4940, 2), // 20:45 NPT, replaces 4410 for the 19th
    ]);
    expect(input.sleepAltitudes).toEqual([
      { date: "2026-09-18", altM: 3860 },
      { date: "2026-09-19", altM: 4940 },
    ]);
    expect(input.latest?.headache).toBe(2);
    expect(input.previous?.headache).toBe(1);
  });

  it("feeds the gain rule: +1,080 m in one night is a caution", () => {
    const result = evaluateAms(
      amsInputFromCheckins(2860, [c("2026-09-18T13:00:00Z", 3860), c("2026-09-19T13:00:00Z", 4940)]),
    );
    expect(result.alerts.map((a) => a.kind)).toContain("ams_gain");
  });
});
