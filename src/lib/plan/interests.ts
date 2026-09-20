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
