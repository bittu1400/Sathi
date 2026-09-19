import { afterEach, describe, expect, it, vi } from "vitest";
import type { AmsResult } from "@/lib/types";
import { deriveAlerts } from "@/lib/alerts";

const now = new Date("2026-09-19T19:26:21.902+05:45");

const amsWithAlerts = (): AmsResult => ({
  level: "warning",
  headline: "Symptoms need attention",
  actions: ["Stop and rest."],
  reasons: ["LLS 7"],
  alerts: [
    {
      kind: "ams_symptoms",
      severity: "warning",
      title: "Altitude symptoms",
      body: "Do not ascend.",
      actions: ["Rest and reassess."],
      dedupeKey: "ams_symptoms:warning:2026-09-19",
    },
    {
      kind: "ams_gain",
      severity: "caution",
      title: "Large altitude gain",
      body: "Plan a rest day.",
      actions: ["Rest before gaining more altitude."],
      dedupeKey: "ams_gain:caution:2026-09-19",
    },
  ],
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("deriveAlerts", () => {
  it("transforms every AMS alert into a complete Alert", () => {
    const randomUUID = vi.fn()
      .mockReturnValueOnce("alert-id-1")
      .mockReturnValueOnce("alert-id-2");
    vi.stubGlobal("crypto", { randomUUID });

    const result = deriveAlerts({
      ams: amsWithAlerts(),
      trekId: "trek-1",
      now,
    });

    expect(result).toEqual([
      {
        id: "alert-id-1",
        trekId: "trek-1",
        kind: "ams_symptoms",
        severity: "warning",
        title: "Altitude symptoms",
        body: "Do not ascend.",
        actions: ["Rest and reassess."],
        createdAt: now.toISOString(),
        acknowledgedAt: null,
        dedupeKey: "ams_symptoms:warning:2026-09-19",
      },
      {
        id: "alert-id-2",
        trekId: "trek-1",
        kind: "ams_gain",
        severity: "caution",
        title: "Large altitude gain",
        body: "Plan a rest day.",
        actions: ["Rest before gaining more altitude."],
        createdAt: now.toISOString(),
        acknowledgedAt: null,
        dedupeKey: "ams_gain:caution:2026-09-19",
      },
    ]);
    expect(randomUUID).toHaveBeenCalledTimes(2);
  });

  it("retains multiple AMS alerts without introducing duplicate dedupe keys", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "alert-id") });

    const result = deriveAlerts({
      ams: amsWithAlerts(),
      trekId: "trek-1",
      now,
    });
    const keys = result.map((alert) => alert.dedupeKey);

    expect(result).toHaveLength(2);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("returns no alert for R8 result-card-only information", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn() });

    const ams: AmsResult = {
      level: "info",
      headline: "Headache needs attention",
      actions: ["Rest and monitor symptoms."],
      reasons: ["Headache without AMS"],
      alerts: [],
    };

    expect(
      deriveAlerts({ ams, trekId: "trek-1", now }),
    ).toEqual([]);
    expect(crypto.randomUUID).not.toHaveBeenCalled();
  });

  it("preserves B-05 dedupe keys on the same day", () => {
    vi.stubGlobal("crypto", {
      randomUUID: vi.fn()
        .mockReturnValueOnce("alert-id-1")
        .mockReturnValueOnce("alert-id-2"),
    });

    const first = deriveAlerts({
      ams: amsWithAlerts(),
      trekId: "trek-1",
      now,
    });
    const second = deriveAlerts({
      ams: amsWithAlerts(),
      trekId: "trek-1",
      now,
    });

    expect(first.map((alert) => alert.dedupeKey)).toEqual(
      second.map((alert) => alert.dedupeKey),
    );
  });

  it("does not alter B-05 dedupe keys on a different day", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "alert-id") });

    const result = deriveAlerts({
      ams: amsWithAlerts(),
      trekId: "trek-1",
      now: new Date("2026-09-20T08:00:00+05:45"),
    });

    expect(result.map((alert) => alert.dedupeKey)).toEqual([
      "ams_symptoms:warning:2026-09-19",
      "ams_gain:caution:2026-09-19",
    ]);
  });
});

describe("deriveAlerts weather", () => {
  const empty: AmsResult = { level: "ok", headline: "", actions: [], reasons: [], alerts: [] };
  const pass = { id: "ebc-kongma-la", name: "Kongma La" };

  it("adds a no_go alert with SAFETY wording and a per-pass daily key", () => {
    vi.stubGlobal("crypto", { randomUUID: vi.fn(() => "w-1") });
    const [alert] = deriveAlerts({
      ams: empty,
      weather: { verdict: { verdict: "no_go", reasons: ["Maximum wind gust is at least 70 km/h."] }, waypoint: pass },
      trekId: "trek-1",
      now: new Date("2026-09-19T20:00:00Z"),
    });
    expect(alert).toMatchObject({
      kind: "weather_nogo",
      severity: "warning",
      title: "Not a good day to cross Kongma La.",
      actions: ["Maximum wind gust is at least 70 km/h."],
      dedupeKey: "weather_nogo:ebc-kongma-la:2026-09-20",
    });
  });

  it("adds nothing for a go verdict", () => {
    expect(
      deriveAlerts({
        ams: empty,
        weather: { verdict: { verdict: "go", reasons: [] }, waypoint: pass },
        trekId: "trek-1",
        now: new Date(),
      }),
    ).toEqual([]);
  });
});
