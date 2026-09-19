import { describe, expect, it } from "vitest";
import { formatAgo, formatCoords, formatAltitude, formatGain, formatKm, formatNepalTime } from "./format";

describe("format", () => {
  it("formats altitude with a thousands separator", () => {
    expect(formatAltitude(4940)).toBe("4,940 m");
    expect(formatAltitude(5364.4)).toBe("5,364 m");
  });
  it("signs altitude gain", () => {
    expect(formatGain(530)).toBe("+530 m");
    expect(formatGain(-1200)).toBe("−1,200 m");
    expect(formatGain(0)).toBe("0 m");
  });
  it("formats distance", () => {
    expect(formatKm(12.34)).toBe("12.3 km");
  });
  it("shows Nepal time (UTC+5:45)", () => {
    expect(formatNepalTime("2026-10-12T08:47:00Z")).toBe("14:32");
  });
});

const now = Date.parse("2026-10-01T12:00:00Z");

describe("formatAgo", () => {
  it("reads naturally at each scale", () => {
    expect(formatAgo("2026-10-01T11:59:40Z", now)).toBe("just now");
    expect(formatAgo("2026-10-01T11:57:00Z", now)).toBe("3 min ago");
    expect(formatAgo("2026-10-01T09:30:00Z", now)).toBe("2 h ago");
    expect(formatAgo("2026-09-29T12:00:00Z", now)).toBe("2 d ago");
  });
  it("never goes negative when the clock is behind", () => {
    expect(formatAgo("2026-10-01T12:05:00Z", now)).toBe("just now");
  });
});

describe("formatCoords", () => {
  it("adds hemisphere letters and four decimals", () => {
    expect(formatCoords(27.98813, 86.925)).toBe("27.9881° N, 86.9250° E");
    expect(formatCoords(-12.5, -70.25)).toBe("12.5000° S, 70.2500° W");
  });
});
