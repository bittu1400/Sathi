import { describe, expect, it } from "vitest";
import { COMMUNITIES, formatAge, getCommunity } from "./community";

describe("community", () => {
  it("has unique slugs and post ids", () => {
    const slugs = COMMUNITIES.map((c) => c.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    const ids = COMMUNITIES.flatMap((c) => c.posts.map((p) => p.id));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("finds a board by slug and nothing else", () => {
    expect(getCommunity("pokhara")?.name).toBe("Pokhara");
    expect(getCommunity("nowhere")).toBeNull();
  });

  it("formats an age in hours, then days", () => {
    expect(formatAge(5)).toBe("5h ago");
    expect(formatAge(23)).toBe("23h ago");
    expect(formatAge(24)).toBe("1d ago");
    expect(formatAge(52)).toBe("2d ago");
  });
});
