import { get, set } from "idb-keyval";
import type { Forecast, Waypoint, WeatherVerdict } from "@/lib/types";

const OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast";
const FORECAST_TIMEOUT_MS = 10_000;
const HOURLY_FIELDS = [
  "temperature_2m",
  "apparent_temperature",
  "precipitation",
  "snowfall",
  "wind_speed_10m",
  "wind_gusts_10m",
  "visibility",
  "freezing_level_height",
] as const;
const DAILY_FIELDS = [
  "temperature_2m_max",
  "temperature_2m_min",
  "snowfall_sum",
  "wind_gusts_10m_max",
  "sunrise",
  "sunset",
] as const;

const REASONS = {
  highWind: "Maximum wind gust is at least 70 km/h.",
  cautionWind: "Maximum wind gust is 50–69 km/h.",
  heavySnow: "Snowfall total is at least 15 cm.",
  cautionSnow: "Snowfall total is 5–14.9 cm.",
  cold: "Minimum apparent temperature is −25 °C or colder.",
  visibility: "Visibility is below 1,000 m during pass-crossing hours.",
} as const;

type ForecastPayload = Omit<Forecast, "stale">;

function isEligible(waypoint: Waypoint): boolean {
  return (
    waypoint.kind === "pass" ||
    waypoint.kind === "basecamp" ||
    waypoint.altM > 4500
  );
}

function next24Hours(forecast: Forecast): number[] {
  return Array.from(
    { length: Math.min(24, forecast.hourly.time.length) },
    (_, index) => index,
  );
}

function localHour(timestamp: string): number | null {
  const match = timestamp.match(/T(\d{2}):\d{2}/);
  if (!match) {
    return null;
  }
  return Number(match[1]);
}

export function evaluateWeather(
  forecast: Forecast,
  waypoint: Waypoint,
): WeatherVerdict {
  if (!isEligible(waypoint)) {
    return { verdict: "go", reasons: [] };
  }

  const indexes = next24Hours(forecast);
  const gusts = indexes
    .map((index) => forecast.hourly.wind_gusts_10m[index])
    .filter((value): value is number => Number.isFinite(value));
  const snowfall = indexes
    .map((index) => forecast.hourly.snowfall[index])
    .filter((value): value is number => Number.isFinite(value));
  const apparentTemperatures = indexes
    .map((index) => forecast.hourly.apparent_temperature[index])
    .filter((value): value is number => Number.isFinite(value));
  const passHoursVisibility = indexes
    .filter((index) => {
      const hour = localHour(forecast.hourly.time[index] ?? "");
      return hour !== null && hour >= 4 && hour < 12;
    })
    .map((index) => forecast.hourly.visibility[index])
    .filter((value): value is number => Number.isFinite(value));

  const maxGust = gusts.length > 0 ? Math.max(...gusts) : null;
  const snowfallTotal = snowfall.reduce((total, value) => total + value, 0);
  const minApparentTemperature =
    apparentTemperatures.length > 0 ? Math.min(...apparentTemperatures) : null;
  const minPassHoursVisibility =
    passHoursVisibility.length > 0 ? Math.min(...passHoursVisibility) : null;
  const reasons: string[] = [];
  let verdict: WeatherVerdict["verdict"] = "go";

  if (maxGust !== null && maxGust >= 70) {
    verdict = "no_go";
    reasons.push(REASONS.highWind);
  }
  if (snowfallTotal >= 15) {
    verdict = "no_go";
    reasons.push(REASONS.heavySnow);
  }
  if (maxGust !== null && maxGust >= 50 && maxGust < 70) {
    if (verdict === "go") {
      verdict = "caution";
    }
    reasons.push(REASONS.cautionWind);
  }
  if (snowfallTotal >= 5 && snowfallTotal < 15) {
    if (verdict === "go") {
      verdict = "caution";
    }
    reasons.push(REASONS.cautionSnow);
  }
  if (minApparentTemperature !== null && minApparentTemperature <= -25) {
    if (verdict === "go") {
      verdict = "caution";
    }
    reasons.push(REASONS.cold);
  }
  if (minPassHoursVisibility !== null && minPassHoursVisibility < 1000) {
    if (verdict === "go") {
      verdict = "caution";
    }
    reasons.push(REASONS.visibility);
  }

  return { verdict, reasons };
}

function cacheKey(lat: number, lng: number, elevationM?: number): string {
  return `wx:${lat},${lng},${elevationM ?? "grid"}`;
}

function isNumberArray(value: unknown): value is number[] {
  return (
    Array.isArray(value) &&
    value.every((item) => typeof item === "number" && Number.isFinite(item))
  );
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function parseForecast(value: unknown): ForecastPayload {
  if (
    typeof value !== "object" ||
    value === null ||
    !("hourly" in value) ||
    !("daily" in value) ||
    !("timezone" in value)
  ) {
    throw new Error("Open-Meteo response has an invalid forecast shape");
  }
  const payload = value as {
    hourly: Record<string, unknown>;
    daily: Record<string, unknown>;
    timezone: unknown;
  };
  const hourlyValid =
    isStringArray(payload.hourly.time) &&
    isNumberArray(payload.hourly.temperature_2m) &&
    isNumberArray(payload.hourly.apparent_temperature) &&
    isNumberArray(payload.hourly.precipitation) &&
    isNumberArray(payload.hourly.snowfall) &&
    isNumberArray(payload.hourly.wind_speed_10m) &&
    isNumberArray(payload.hourly.wind_gusts_10m) &&
    isNumberArray(payload.hourly.visibility) &&
    isNumberArray(payload.hourly.freezing_level_height);
  const dailyValid =
    isStringArray(payload.daily.time) &&
    isNumberArray(payload.daily.temperature_2m_max) &&
    isNumberArray(payload.daily.temperature_2m_min) &&
    isNumberArray(payload.daily.snowfall_sum) &&
    isNumberArray(payload.daily.wind_gusts_10m_max) &&
    isStringArray(payload.daily.sunrise) &&
    isStringArray(payload.daily.sunset);
  if (!hourlyValid || !dailyValid || typeof payload.timezone !== "string") {
    throw new Error("Open-Meteo response has an invalid forecast shape");
  }
  const hourly = {
    time: payload.hourly.time as string[],
    temperature_2m: payload.hourly.temperature_2m as number[],
    apparent_temperature: payload.hourly.apparent_temperature as number[],
    precipitation: payload.hourly.precipitation as number[],
    snowfall: payload.hourly.snowfall as number[],
    wind_speed_10m: payload.hourly.wind_speed_10m as number[],
    wind_gusts_10m: payload.hourly.wind_gusts_10m as number[],
    visibility: payload.hourly.visibility as number[],
    freezing_level_height: payload.hourly.freezing_level_height as number[],
  };
  const daily = {
    time: payload.daily.time as string[],
    temperature_2m_max: payload.daily.temperature_2m_max as number[],
    temperature_2m_min: payload.daily.temperature_2m_min as number[],
    snowfall_sum: payload.daily.snowfall_sum as number[],
    wind_gusts_10m_max: payload.daily.wind_gusts_10m_max as number[],
    sunrise: payload.daily.sunrise as string[],
    sunset: payload.daily.sunset as string[],
  };
  return {
    hourly,
    daily,
    timezone: payload.timezone,
  };
}

export async function fetchForecast({
  lat,
  lng,
  elevationM,
}: {
  lat: number;
  lng: number;
  elevationM?: number;
}): Promise<Forecast> {
  const key = cacheKey(lat, lng, elevationM);
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    hourly: HOURLY_FIELDS.join(","),
    daily: DAILY_FIELDS.join(","),
    timezone: "Asia/Kathmandu",
    forecast_days: "5",
  });
  if (elevationM !== undefined) {
    params.set("elevation", String(elevationM));
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FORECAST_TIMEOUT_MS);
    let response: Response;
    try {
      response = await fetch(`${OPEN_METEO_URL}?${params.toString()}`, {
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
    if (!response.ok || response.redirected) {
      throw new Error("Open-Meteo forecast request failed");
    }
    const forecast = parseForecast(await response.json());
    await set(key, forecast);
    return forecast;
  } catch (cause) {
    const cached = await get<ForecastPayload>(key);
    if (cached === undefined) {
      throw cause;
    }
    return { ...cached, stale: true };
  }
}
