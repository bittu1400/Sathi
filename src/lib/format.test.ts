import { describe, expect, it } from "vitest";
import { formatAltitude, formatGain, formatKm, formatNepalTime } from "./format";

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
