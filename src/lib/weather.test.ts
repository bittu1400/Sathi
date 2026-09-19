import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Forecast, Waypoint } from "@/lib/types";

const cache = new Map<string, unknown>();

vi.mock("idb-keyval", () => ({
  get: vi.fn((key: string) => Promise.resolve(cache.get(key))),
  set: vi.fn((key: string, value: unknown) => {
    cache.set(key, value);
    return Promise.resolve();
  }),
}));

import { evaluateWeather, fetchForecast } from "@/lib/weather";

const waypoint = (overrides: Partial<Waypoint> = {}): Waypoint => ({
  id: "thorong-la",
  name: "Thorong La",
  lat: 28.7,
  lng: 84.4,
  altM: 5416,
  kind: "pass",
  hasTeahouse: false,
  signal: "none",
  ...overrides,
});

const forecast = (
  overrides: Partial<{
    gusts: number[];
    snowfall: number[];
    apparent: number[];
    visibility: number[];
    times: string[];
  }> = {},
): Forecast => {
  const times = overrides.times ?? Array.from(
    { length: 25 },
    (_, index) => `2026-09-19T${String(index % 24).padStart(2, "0")}:00`,
  );
  const hourly = (value: number): number[] =>
    Array.from({ length: times.length }, () => value);
  return {
    hourly: {
      time: times,
      temperature_2m: hourly(0),
      apparent_temperature: overrides.apparent ?? hourly(0),
      precipitation: hourly(0),
      snowfall: overrides.snowfall ?? hourly(0),
      wind_speed_10m: hourly(0),
      wind_gusts_10m: overrides.gusts ?? hourly(0),
      visibility: overrides.visibility ?? hourly(2000),
      freezing_level_height: hourly(0),
    },
    daily: {
      time: ["2026-09-19"],
      temperature_2m_max: [0],
      temperature_2m_min: [0],
      snowfall_sum: [0],
      wind_gusts_10m_max: [0],
      sunrise: ["2026-09-19T05:45"],
      sunset: ["2026-09-19T18:00"],
    },
    timezone: "Asia/Kathmandu",
  };
};

const withFirst = (values: number[], value: number): number[] => [
  value,
  ...values.slice(1),
];

beforeEach(() => {
  cache.clear();
  vi.restoreAllMocks();
});

describe("evaluateWeather", () => {
  it.each([
    ["70 km/h gust", { gusts: withFirst(Array(25).fill(0), 70) }, "no_go"],
    ["15 cm snowfall", { snowfall: withFirst(Array(25).fill(0), 15) }, "no_go"],
    ["50 km/h gust", { gusts: withFirst(Array(25).fill(0), 50) }, "caution"],
    ["69 km/h gust", { gusts: withFirst(Array(25).fill(0), 69) }, "caution"],
    ["5 cm snowfall", { snowfall: withFirst(Array(25).fill(0), 5) }, "caution"],
    ["14.9 cm snowfall", { snowfall: withFirst(Array(25).fill(0), 14.9) }, "caution"],
    [
      "-25 C apparent temperature",
      { apparent: withFirst(Array(25).fill(0), -25) },
      "caution",
    ],
  ])("%s returns %s", (_name, overrides, verdict) => {
    expect(evaluateWeather(forecast(overrides), waypoint()).verdict).toBe(
      verdict,
    );
  });

  it("returns caution for visibility below 1000 m during 04:00–12:00", () => {
    const visibility = Array(25).fill(2000);
    visibility[4] = 999;
    expect(evaluateWeather(forecast({ visibility }), waypoint())).toEqual({
      verdict: "caution",
      reasons: ["Visibility is below 1,000 m during pass-crossing hours."],
    });
  });

  it("does not warn for visibility exactly 1000 m", () => {
    const visibility = Array(25).fill(2000);
    visibility[4] = 1000;
    expect(evaluateWeather(forecast({ visibility }), waypoint()).verdict).toBe(
      "go",
    );
  });

  it("does not warn for poor visibility outside 04:00–12:00", () => {
    const visibility = Array(25).fill(2000);
    visibility[2] = 999;
    visibility[12] = 999;
    expect(evaluateWeather(forecast({ visibility }), waypoint()).verdict).toBe(
      "go",
    );
  });

  it("returns go for a non-eligible waypoint", () => {
    const result = evaluateWeather(
      forecast({
        gusts: withFirst(Array(25).fill(0), 100),
        snowfall: withFirst(Array(25).fill(0), 20),
      }),
      waypoint({ kind: "village", altM: 4500 }),
    );
    expect(result).toEqual({ verdict: "go", reasons: [] });
  });

  it.each([
    ["pass", waypoint({ kind: "pass", altM: 3000 })],
    ["basecamp", waypoint({ kind: "basecamp", altM: 3000 })],
    ["high waypoint", waypoint({ kind: "village", altM: 4501 })],
  ])("evaluates an eligible %s", (_name, eligibleWaypoint) => {
    expect(
      evaluateWeather(
        forecast({ gusts: withFirst(Array(25).fill(0), 70) }),
        eligibleWaypoint,
      ).verdict,
    ).toBe("no_go");
  });

  it("collects multiple reasons and uses no_go precedence", () => {
    const visibility = Array(25).fill(2000);
    visibility[4] = 999;
    const result = evaluateWeather(
      forecast({
        gusts: withFirst(Array(25).fill(0), 70),
        snowfall: withFirst(Array(25).fill(0), 15),
        apparent: withFirst(Array(25).fill(0), -25),
        visibility,
      }),
      waypoint(),
    );
    expect(result.verdict).toBe("no_go");
    expect(result.reasons).toHaveLength(4);
  });

  it("only evaluates the first 24 hourly entries", () => {
    const gusts = Array(25).fill(0);
    gusts[24] = 100;
    expect(evaluateWeather(forecast({ gusts }), waypoint()).verdict).toBe("go");
  });
});

describe("fetchForecast", () => {
  it("uses the documented Open-Meteo URL and parameters", async () => {
    const response = forecast();
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      redirected: false,
      json: () => Promise.resolve(response),
    });
    vi.stubGlobal("fetch", fetchMock);

    await fetchForecast({ lat: 28.7, lng: 84.4, elevationM: 5416 });

    const url = new URL(fetchMock.mock.calls[0]?.[0] as string);
    expect(url.origin + url.pathname).toBe(
      "https://api.open-meteo.com/v1/forecast",
    );
    expect(url.searchParams.get("latitude")).toBe("28.7");
    expect(url.searchParams.get("longitude")).toBe("84.4");
    expect(url.searchParams.get("elevation")).toBe("5416");
    expect(url.searchParams.get("timezone")).toBe("Asia/Kathmandu");
    expect(url.searchParams.get("forecast_days")).toBe("5");
    expect(url.searchParams.get("hourly")).toContain("wind_gusts_10m");
    expect(url.searchParams.get("daily")).toContain("snowfall_sum");
  });

  it("omits elevation when elevationM is not supplied", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      redirected: false,
      json: () => Promise.resolve(forecast()),
    }));

    await fetchForecast({ lat: 28.7, lng: 84.4 });

    const url = new URL(
      (fetch as ReturnType<typeof vi.fn>).mock.calls[0]?.[0] as string,
    );
    expect(url.searchParams.has("elevation")).toBe(false);
  });

  it("falls back to a cached forecast after a fetch failure", async () => {
    const cached = forecast();
    cache.set("wx:28.7,84.4,5416", cached);
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));

    await expect(fetchForecast({ lat: 28.7, lng: 84.4, elevationM: 5416 }))
      .resolves.toEqual({ ...cached, stale: true });
  });

  it("caches successful responses", async () => {
    const response = forecast();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      redirected: false,
      json: () => Promise.resolve(response),
    }));

    await fetchForecast({ lat: 28.7, lng: 84.4, elevationM: 5416 });
    expect(cache.get("wx:28.7,84.4,5416")).toEqual(response);
  });

  it("does not cache redirects or errors", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: false,
      redirected: true,
      json: () => Promise.resolve(forecast()),
    }));

    await expect(fetchForecast({ lat: 28.7, lng: 84.4 })).rejects.toThrow();
    expect(cache.size).toBe(0);
  });

  it("aborts a request after 10 seconds", async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      "fetch",
      vi.fn(
        (input: RequestInfo | URL, init?: RequestInit) =>
          new Promise((_resolve, reject) => {
            init?.signal?.addEventListener("abort", () =>
              reject(new Error(`aborted ${String(input)}`)),
            );
          }),
      ),
    );

    const request = fetchForecast({ lat: 28.7, lng: 84.4 });
    const rejection = expect(request).rejects.toThrow("aborted");
    await vi.advanceTimersByTimeAsync(10_000);
    await rejection;
    vi.useRealTimers();
  });
});
