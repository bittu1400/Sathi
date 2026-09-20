/** What a trekker wants to see. Drives the recommendation, not the routing. */
export const INTERESTS = [
  { id: "mountains", label: "Mountains" },
  { id: "rivers", label: "Rivers" },
  { id: "sunrise", label: "Sunrise points" },
  { id: "lakes", label: "Lakes" },
  { id: "waterfalls", label: "Waterfalls" },
  { id: "forests", label: "Forests" },
  { id: "culture", label: "Temples & culture" },
  { id: "villages", label: "Villages" },
  { id: "teahouses", label: "Teahouses & hotels" },
  { id: "wildlife", label: "Wildlife" },
] as const;

export type InterestId = (typeof INTERESTS)[number]["id"];

export const INTEREST_IDS = INTERESTS.map((i) => i.id) as InterestId[];

export function interestLabel(id: InterestId): string {
  return INTERESTS.find((i) => i.id === id)?.label ?? id;
}
