import { describe, expect, it } from "vitest";
import { isCheckinDue } from "./checkin-due";

// 12:00Z = 17:45 in Nepal; 04:00Z = 09:45.
const evening = new Date("2026-10-01T12:00:00Z");
const morning = new Date("2026-10-01T04:00:00Z");

describe("isCheckinDue", () => {
  it("is not due before 16:00 Nepal time", () => {
    expect(isCheckinDue([], morning)).toBe(false);
  });
  it("is due in the evening with no check-in today", () => {
    expect(isCheckinDue([], evening)).toBe(true);
    expect(isCheckinDue(["2026-09-30T12:00:00Z"], evening)).toBe(true);
  });
  it("is not due once today's check-in exists", () => {
    expect(isCheckinDue(["2026-10-01T05:00:00Z"], evening)).toBe(false);
  });
});
