/**
 * Static community boards: trekkers swapping notes about a place, forum style.
 * Demo content — the place names are real, the posts and the people are not.
 * No phone numbers, coordinates or safety advice live here (CLAUDE.md rule 6);
 * medical wording only ever comes from `ams-copy.ts`.
 */
export interface CommunityPost {
  id: string;
  title: string;
  author: string;
  /** Hours since posting, so the list reads the same on every render. */
  agoHours: number;
  score: number;
  comments: number;
  body: string;
}

export interface Community {
  slug: string;
  name: string;
  /** Where it is, for the list row. */
  place: string;
  blurb: string;
  members: number;
  posts: CommunityPost[];
}

export const COMMUNITIES: Community[] = [
  {
    slug: "pokhara",
    name: "Pokhara",
    place: "Gandaki · 827 m",
    blurb: "Lakeside base camp for the Annapurnas: food, rooms, paragliding, getting out to the trailheads.",
    members: 4820,
    posts: [
      {
        id: "pkr-1",
        title: "Best dal bhat on Lakeside under Rs 400?",
        author: "sunita_r",
        agoHours: 5,
        score: 128,
        comments: 34,
        body: "Been here a week and the tourist strip prices are creeping up. The places one street back from the lake still do a proper unlimited plate. Where do you eat?",
      },
      {
        id: "pkr-2",
        title: "Jeep share to Nayapul, Thursday morning",
        author: "trek_with_bikash",
        agoHours: 11,
        score: 96,
        comments: 21,
        body: "Two seats left, leaving from Baglung bus park around 6am. Splitting it four ways is cheaper than the bus once you count the wait.",
      },
      {
        id: "pkr-3",
        title: "Paragliding from Sarangkot — which window is calmest?",
        author: "aashika",
        agoHours: 26,
        score: 74,
        comments: 18,
        body: "Flew mid-morning and it was punchy. Locals say the first slot after sunrise is the smooth one. Anyone flown both?",
      },
      {
        id: "pkr-4",
        title: "Left a blue duffel at a Lakeside guesthouse in March",
        author: "marek_cz",
        agoHours: 52,
        score: 41,
        comments: 12,
        body: "Long shot. Stored it while I went up to Mardi and the place changed hands. If anyone knows who runs it now, I'd love a name.",
      },
      {
        id: "pkr-5",
        title: "World Peace Pagoda walk-up vs taxi",
        author: "hari.gurung",
        agoHours: 73,
        score: 33,
        comments: 9,
        body: "The walk up from Damside is about 90 minutes and shaded most of the way. Take the boat across first, it cuts the boring part.",
      },
    ],
  },
  {
    slug: "everest-base-camp",
    name: "Everest Base Camp",
    place: "Khumbu · up to 5,364 m",
    blurb: "Lukla to base camp: teahouses, acclimatisation days, charging, and what the weather actually did.",
    members: 9140,
    posts: [
      {
        id: "ebc-1",
        title: "Namche acclimatisation day — what did you actually do?",
        author: "pemba_sherpa",
        agoHours: 3,
        score: 312,
        comments: 87,
        body: "Everyone says 'walk high, sleep low' but nobody says where. The hike up to the Everest View Hotel and back is the standard one and it fills the day nicely.",
      },
      {
        id: "ebc-2",
        title: "Charging costs above Dingboche, October numbers",
        author: "lena.k",
        agoHours: 14,
        score: 204,
        comments: 45,
        body: "Roughly doubles every stop past Dingboche. A small power bank paid for itself in two days. Solar was useless once the afternoon cloud came in.",
      },
      {
        id: "ebc-3",
        title: "Lukla flights cancelled two days running — what are people doing?",
        author: "dawa_t",
        agoHours: 30,
        score: 188,
        comments: 62,
        body: "Half the lodge is waiting it out, half booked the helicopter share. The drive to Salleri and walking in is the slow but certain option.",
      },
      {
        id: "ebc-4",
        title: "Teahouse wifi vs a local SIM on the trail",
        author: "josh_w",
        agoHours: 48,
        score: 141,
        comments: 39,
        body: "SIM data held up to about Tengboche for me, then nothing usable. Downloaded the maps before Lukla and never regretted it.",
      },
      {
        id: "ebc-5",
        title: "Going up with a headache — read the room, please",
        author: "annapurna_anu",
        agoHours: 96,
        score: 260,
        comments: 71,
        body: "Saw three people pushed up by their own schedule this week. Your booking is not a reason. Talk to your guide and use the app's altitude check before you decide anything.",
      },
    ],
  },
  {
    slug: "kathmandu",
    name: "Kathmandu",
    place: "Bagmati · 1,400 m",
    blurb: "Permits, gear shops, buses out, and where to eat after you come down.",
    members: 7305,
    posts: [
      {
        id: "ktm-1",
        title: "TIMS and permit office queue — go early or go late?",
        author: "rajesh.np",
        agoHours: 6,
        score: 175,
        comments: 52,
        body: "Went at opening and was out in 25 minutes. Friend went at 2pm and gave up. Bring passport photos, they still ask.",
      },
      {
        id: "ktm-2",
        title: "Thamel gear: what's worth buying and what isn't",
        author: "gear_goat",
        agoHours: 19,
        score: 149,
        comments: 44,
        body: "Down jacket rental, yes. Boots, absolutely not — break them in at home. Duffels and poles here are fine for one trek.",
      },
      {
        id: "ktm-3",
        title: "Night bus to Besisahar vs morning tourist bus",
        author: "shreya_m",
        agoHours: 33,
        score: 88,
        comments: 26,
        body: "Took the morning one. Slower but you see the road, and you arrive able to walk. Night bus saves a day and costs you the next one.",
      },
      {
        id: "ktm-4",
        title: "Where to leave a bag for three weeks",
        author: "oliver.b",
        agoHours: 61,
        score: 57,
        comments: 15,
        body: "Most Thamel guesthouses store free if you book a night on either side. Label it and photograph the lock.",
      },
    ],
  },
  {
    slug: "annapurna-circuit",
    name: "Annapurna Circuit",
    place: "Manang & Mustang · up to 5,416 m",
    blurb: "Besisahar round to Jomsom: Thorong La, the road, side trips and the wind.",
    members: 6120,
    posts: [
      {
        id: "acc-1",
        title: "Thorong La crossing — what time did you leave High Camp?",
        author: "manang_maya",
        agoHours: 8,
        score: 231,
        comments: 66,
        body: "Left at 4:30am, over by 9, down in Muktinath for a late lunch. Anyone leaving before 4 was walking in the dark for no reason.",
      },
      {
        id: "acc-2",
        title: "The road has eaten more of the trail — is the NATT route still worth it?",
        author: "circuit_rat",
        agoHours: 22,
        score: 167,
        comments: 48,
        body: "Yes. The red-and-white marked alternatives keep you off the jeep track for most of the Manang side and the walking is far nicer.",
      },
      {
        id: "acc-3",
        title: "Afternoon wind in Kali Gandaki — plan around it",
        author: "jomsom_jyoti",
        agoHours: 40,
        score: 134,
        comments: 31,
        body: "It picks up around 11am and by 1pm you're eating sand. Start early, be in by lunch, take the afternoon off.",
      },
      {
        id: "acc-4",
        title: "Tilicho side trip: two days or three?",
        author: "kiran_s",
        agoHours: 70,
        score: 112,
        comments: 29,
        body: "Three if you want to enjoy it. The landslide section is fine in the morning and horrible in the afternoon heat.",
      },
    ],
  },
  {
    slug: "langtang",
    name: "Langtang Valley",
    place: "Rasuwa · up to 4,984 m",
    blurb: "The quiet valley: Kyanjin Gompa, cheese, and a community that rebuilt itself.",
    members: 2480,
    posts: [
      {
        id: "lng-1",
        title: "Kyanjin Ri or Tserko Ri for the acclimatisation day?",
        author: "tashi_langtang",
        agoHours: 9,
        score: 143,
        comments: 37,
        body: "Kyanjin Ri is short and steep, Tserko Ri is long and gradual. Most people do Kyanjin on arrival day and Tserko the next.",
      },
      {
        id: "lng-2",
        title: "Bus from Machhapokhari to Syabrubesi — current reality",
        author: "bikram.rai",
        agoHours: 27,
        score: 98,
        comments: 24,
        body: "Seven hours on a good day, nine on a normal one. Sit on the left going up for the view and the shade.",
      },
      {
        id: "lng-3",
        title: "The yak cheese factory at Kyanjin is open again",
        author: "cheese_pilgrim",
        agoHours: 44,
        score: 86,
        comments: 19,
        body: "Buy a block, carry it down, regret nothing. Cash only and they run out by mid-afternoon.",
      },
      {
        id: "lng-4",
        title: "Trail conditions after last week's rain",
        author: "nima_d",
        agoHours: 58,
        score: 64,
        comments: 17,
        body: "Two wet slabs between Lama Hotel and Ghodatabela, nothing technical. Lodges all have space, it's a quiet season so far.",
      },
    ],
  },
];

export function getCommunity(slug: string): Community | null {
  return COMMUNITIES.find((c) => c.slug === slug) ?? null;
}

/** "5h ago" / "2d ago" — posts carry an age, never a timestamp that would drift. */
export function formatAge(hours: number): string {
  return hours < 24 ? `${hours}h ago` : `${Math.round(hours / 24)}d ago`;
}
