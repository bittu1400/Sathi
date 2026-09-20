import { describe, expect, it } from "vitest";
import { INTEREST_IDS, placeWord } from "./interests";

describe("placeWord", () => {
  it("says what OSM says the place is", () => {
    expect(placeWord("stupa", "culture")).toBe("Stupa");
    expect(placeWord("viewpoint", "sunrise")).toBe("Viewpoint");
    expect(placeWord("guest_house", "teahouses")).toBe("Guest house");
  });

  it("does not decide that a place of worship is a temple", () => {
    expect(placeWord("place_of_worship", "culture")).toBe("Place of worship");
  });

  it("falls back to the interest when the tag has no word", () => {
    // Rivers come back with no amenity/tourism/natural tag of their own.
    expect(placeWord("", "rivers")).toBe("River");
    expect(placeWord("something_new", "forests")).toBe("Forest");
  });

  it("has a word for every interest, so a pin is never unlabelled", () => {
    for (const id of INTEREST_IDS) expect(placeWord("", id)).toMatch(/\w/);
  });
});
