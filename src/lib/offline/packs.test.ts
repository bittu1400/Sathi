import { describe, expect, it } from "vitest";
import { isUsableTilesUrl } from "./packs";

describe("isUsableTilesUrl", () => {
  it("accepts a real https tiles URL", () => {
    expect(isUsableTilesUrl("https://abc.supabase.co/storage/v1/object/public/tiles/ebc.pmtiles")).toBe(true);
  });

  it("rejects missing, relative and placeholder URLs", () => {
    expect(isUsableTilesUrl(undefined)).toBe(false);
    expect(isUsableTilesUrl("")).toBe(false);
    expect(isUsableTilesUrl("/tiles/ebc.pmtiles")).toBe(false);
    expect(isUsableTilesUrl("https://example.supabase.co/storage/v1/object/public/tiles/ebc.pmtiles")).toBe(false);
  });
});
