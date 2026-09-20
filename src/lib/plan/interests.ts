/** What a trekker wants to see. Drives the recommendation, not the routing. */
export const INTERESTS = [
  { id: "mountains", label: "Mountains", nature: true },
  { id: "rivers", label: "Rivers", nature: true },
  { id: "sunrise", label: "Sunrise points", nature: true },
  { id: "lakes", label: "Lakes", nature: true },
  { id: "waterfalls", label: "Waterfalls", nature: true },
  { id: "forests", label: "Forests & parks", nature: true },
  { id: "culture", label: "Temples & culture", nature: false },
  { id: "villages", label: "Villages & squares", nature: false },
  { id: "teahouses", label: "Teahouses & hotels", nature: false },
  { id: "wildlife", label: "Wildlife", nature: true },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export const INTEREST_IDS = INTERESTS.map((i) => i.id) as InterestId[];

export function interestLabel(id: InterestId): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}

export function isNature(id: InterestId): boolean {
  return INTERESTS.find((i) => i.id === id)?.nature ?? false;
}

/**
 * What a place is, in one or two words, from the OSM tag it came in on. A pin
 * that says "3" tells the trekker nothing; "Boudhanath · Stupa" tells them why
 * it is on the route. The words are OSM's own — nothing here decides that a
 * place of worship is a temple.
 */
const PLACE_WORDS: Record<string, string> = {
  place_of_worship: "Place of worship",
  museum: "Museum",
  monument: "Monument",
  memorial: "Memorial",
  stupa: "Stupa",
  peak: "Peak",
  viewpoint: "Viewpoint",
  hotel: "Hotel",
  guest_house: "Guest house",
  alpine_hut: "Mountain hut",
  cafe: "Cafe",
  village: "Village",
  town: "Town",
  square: "Square",
  attraction: "Attraction",
  park: "Park",
  national_park: "National park",
  water: "Lake",
  waterfall: "Waterfall",
  zoo: "Zoo",
  protected_area: "Protected area",
};

/** What the interest itself says, for a place whose tag we have no word for. */
const INTEREST_WORDS: Record<InterestId, string> = {
  mountains: "Peak",
  rivers: "River",
  sunrise: "Viewpoint",
  lakes: "Lake",
  waterfalls: "Waterfall",
  forests: "Forest",
  culture: "Cultural site",
  villages: "Village",
  teahouses: "Teahouse",
  wildlife: "Wildlife area",
};

/**
 * The one or two words that say what a place is. Exported for its test: it is
 * what a map pin and a stop list read out.
 */
export function placeWord(kind: string, interest: InterestId): string {
  return PLACE_WORDS[kind] ?? INTEREST_WORDS[interest];
}

/**
 * Overpass tag filters per interest. Nodes and ways both, because a temple is
 * usually a way and a peak is always a node.
 */
export const OVERPASS_FILTERS: Record<InterestId, string[]> = {
  mountains: ['["natural"="peak"]', '["mountain_pass"="yes"]'],
  rivers: ['["waterway"="river"]["name"]'],
  sunrise: ['["tourism"="viewpoint"]'],
  lakes: ['["natural"="water"]["water"~"lake|reservoir"]["name"]'],
  waterfalls: ['["waterway"="waterfall"]'],
  forests: ['["leisure"="park"]["name"]', '["boundary"="national_park"]["name"]'],
  culture: ['["amenity"="place_of_worship"]["name"]', '["tourism"="museum"]', '["historic"~"monument|memorial|stupa"]'],
  villages: ['["place"~"village|town|square"]["name"]', '["tourism"="attraction"]["name"]'],
  teahouses: ['["tourism"~"hotel|guest_house|alpine_hut"]["name"]', '["amenity"="cafe"]["name"]'],
  wildlife: ['["boundary"="protected_area"]["name"]', '["tourism"="zoo"]["name"]'],
};
