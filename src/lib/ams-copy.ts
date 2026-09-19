import type { RedFlag } from "@/lib/types";

// Rules mirror SAFETY.md §2. Do not change without updating SAFETY.md and DECISIONS.md.

export const STANDARD_DISCLAIMER =
  "Sathi provides general safety information and helps you share your location. It does not provide medical diagnosis or guarantee rescue. In an emergency, descend if you can do so safely, and contact local rescue services directly. If in doubt, go down.";

export const RED_FLAG_LABELS: Record<RedFlag, string> = {
  confusion: "Confused, very drowsy, or acting strangely",
  ataxia: "Can't walk in a straight line heel-to-toe / stumbling",
  breathless_at_rest: "Out of breath while resting",
  wet_cough: "Wet or gurgling cough, or pink/frothy spit",
  severe_headache_unrelieved: "Severe headache that painkillers don't help",
};

export const DANGER_HEADLINE = "Descend now. Do not go higher.";
export const DANGER_ACTIONS = [
  "Start descending with a companion right away, if it is safe to move. Guidelines advise going down at least 300–1,000 m, or until symptoms clearly improve.",
  "Do not stay alone. Tell your guide, teahouse owner, or other trekkers.",
  "Use SOS to alert coordination and your emergency contact.",
  "If you have oxygen or medication prescribed for altitude illness, use it as instructed while descending.",
];

export const WARNING_HEADLINE = "Do not go higher today.";
export const WARNING_ACTIONS = [
  "Rest at this altitude. Do not ascend until your symptoms are gone.",
  "If symptoms get worse, or don't improve within 24 hours, descend.",
  "Drink fluids, eat, avoid alcohol and sleeping pills.",
  "Check in again in 6 hours.",
];

export const SYMPTOM_CAUTION_HEADLINE =
  "Take it easy. Don't ascend further today.";
export const SYMPTOM_CAUTION_ACTIONS = [
  "Rest and reassess",
  "Drink fluids and eat",
  "Check in again this evening",
  "Descend if symptoms worsen",
];

export const GAIN_CAUTION_HEADLINE = "You're climbing fast.";
export const GAIN_CAUTION_ACTIONS = [
  "Consider an extra night here, or sleep lower",
  "Watch for headache, nausea, fatigue",
  "Check in tonight",
];
export const gainCautionBody = (gain: number) =>
  `Your sleeping altitude went up ${gain} m in one day. Above 3,000 m, guidelines recommend going no more than 500 m higher each night.`;

export const REST_DAY_HEADLINE = "Time for an acclimatization day.";
export const REST_DAY_BODY =
  "Guidelines recommend a rest day every 3–4 days above 3,000 m. Hike high during the day, sleep at the same altitude.";

export const MILD_HEADACHE_INFO =
  "Mild headache without other symptoms. Rest, hydrate, and check in again later.";
export const OK_MESSAGE =
  "No warning signs right now. Keep ascending gradually and check in every evening.";
