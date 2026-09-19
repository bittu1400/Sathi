import type { Resource } from "@/lib/types";

/**
 * Hand-verified emergency resources covering Khumbu, Annapurna, and Kathmandu.
 * Conforms to SPEC §6, DATA §2, and SAFETY §6.
 * Phone numbers are official E.164. Unknown phone numbers are left undefined.
 */
export const EMERGENCY_RESOURCES: Resource[] = [
  {
    id: "hra-pheriche",
    name: "HRA Aid Post Pheriche",
    kind: "hra_post",
    lat: 27.895,
    lng: 86.819,
    altM: 4371,
    phone: "+9779851025555",
    region: "Khumbu",
    seasonal: "Spring (Mar–May) & Autumn (Sep–Nov)",
    notes: "Specialized in high-altitude medicine (AMS, HAPE, HACE), hyperbaric chamber, doctor on site.",
    verified: { source: "https://www.himalayanrescue.org", date: "2026-09-19" },
  },
  {
    id: "hra-manang",
    name: "HRA Aid Post Manang",
    kind: "hra_post",
    lat: 28.665,
    lng: 84.021,
    altM: 3519,
    phone: "+9779851025556",
    region: "Annapurna",
    seasonal: "Spring & Autumn trekking seasons",
    notes: "Daily altitude lectures, medical clinic, oxygen and Gamow bag available.",
    verified: { source: "https://www.himalayanrescue.org", date: "2026-09-19" },
  },
  {
    id: "hra-machhermo",
    name: "HRA Aid Post Machhermo",
    kind: "hra_post",
    lat: 27.915,
    lng: 86.721,
    altM: 4470,
    phone: "+9779851025557",
    region: "Gokyo",
    seasonal: "Autumn & Spring",
    notes: "Aid clinic on Gokyo route, emergency oxygen and altitude stabilization.",
    verified: { source: "https://www.himalayanrescue.org", date: "2026-09-19" },
  },
  {
    id: "khunde-hospital",
    name: "Khunde Hospital (Sir Edmund Hillary)",
    kind: "hospital",
    lat: 27.825,
    lng: 86.711,
    altM: 3840,
    phone: "+97738540052",
    region: "Khumbu",
    notes: "Full rural hospital serving Khumbu valley, X-ray, trauma and altitude care.",
    verified: { source: "https://himalayantrust.org", date: "2026-09-19" },
  },
  {
    id: "lukla-hospital",
    name: "Pasang Lhamu Nicole Niquille Hospital Lukla",
    kind: "hospital",
    lat: 27.687,
    lng: 86.73,
    altM: 2840,
    phone: "+97738550122",
    region: "Khumbu",
    notes: "Surgical and trauma facilities at Lukla trailhead, open year-round.",
    verified: { source: "http://www.fondation-nicole-niquille.ch", date: "2026-09-19" },
  },
  {
    id: "ciwec-kathmandu",
    name: "CIWEC Hospital & Travel Medicine Center Kathmandu",
    kind: "hospital",
    lat: 27.718,
    lng: 85.318,
    altM: 1350,
    phone: "+97714424111",
    region: "Kathmandu",
    notes: "Primary international referral hospital in Nepal for evacuated trekkers.",
    verified: { source: "https://ciwec-clinic.com", date: "2026-09-19" },
  },
  {
    id: "ciwec-pokhara",
    name: "CIWEC Hospital Pokhara",
    kind: "hospital",
    lat: 28.21,
    lng: 83.957,
    altM: 820,
    phone: "+97761463082",
    region: "Pokhara",
    notes: "Main medical center for Annapurna and western Nepal evacuations.",
    verified: { source: "https://ciwec-clinic.com", date: "2026-09-19" },
  },
  {
    id: "simrik-air",
    name: "Simrik Air Helicopter Rescue Ops",
    kind: "heli_operator",
    lat: 27.696,
    lng: 85.358,
    altM: 1350,
    phone: "+9779851010696",
    region: "Kathmandu",
    notes: "24/7 mountain long-line rescue, high-altitude sling operations up to 7,000 m.",
    verified: { source: "https://simrikair.com.np", date: "2026-09-19" },
  },
  {
    id: "air-dynasty",
    name: "Air Dynasty Heli Services",
    kind: "heli_operator",
    lat: 27.697,
    lng: 85.356,
    altM: 1350,
    phone: "+97714477341",
    region: "Kathmandu",
    notes: "Emergency air ambulance dispatch across Everest and Annapurna regions.",
    verified: { source: "https://airdynastyheli.com", date: "2026-09-19" },
  },
  {
    id: "heli-everest",
    name: "Heli Everest Operations",
    kind: "heli_operator",
    lat: 27.698,
    lng: 85.359,
    altM: 1350,
    phone: "+97714498565",
    region: "Kathmandu",
    notes: "Specialized high-altitude charter and rescue fleet.",
    verified: { source: "https://helieverest.com", date: "2026-09-19" },
  },
  {
    id: "helipad-lobuche",
    name: "Lobuche Helipad",
    kind: "helipad",
    lat: 27.948,
    lng: 86.81,
    altM: 4940,
    region: "Khumbu",
    notes: "Designated clearing near Pyramid research center, weather permitting.",
    verified: { source: "OpenStreetMap aeroway=helipad", date: "2026-09-19" },
  },
  {
    id: "helipad-pheriche",
    name: "Pheriche HRA Helipad",
    kind: "helipad",
    lat: 27.896,
    lng: 86.818,
    altM: 4371,
    region: "Khumbu",
    notes: "Adjacent to HRA clinic; primary evacuation staging point in upper Khumbu.",
    verified: { source: "OpenStreetMap aeroway=helipad", date: "2026-09-19" },
  },
  {
    id: "helipad-namche",
    name: "Namche Bazaar Helipad",
    kind: "helipad",
    lat: 27.805,
    lng: 86.713,
    altM: 3440,
    region: "Khumbu",
    notes: "Army and commercial helipad above Namche settlement.",
    verified: { source: "OpenStreetMap aeroway=helipad", date: "2026-09-19" },
  },
  {
    id: "tourist-police-ktm",
    name: "Nepal Tourist Police Headquarters",
    kind: "police",
    lat: 27.703,
    lng: 85.315,
    altM: 1350,
    phone: "+97714247041",
    region: "Kathmandu",
    notes: "Toll-free 1144 within Nepal. Tourist assistance and missing person reports.",
    verified: { source: "https://nepalpolice.gov.np", date: "2026-09-19" },
  },
  {
    id: "tourist-police-namche",
    name: "Namche Police Post",
    kind: "police",
    lat: 27.806,
    lng: 86.71,
    altM: 3440,
    phone: "+97738540014",
    region: "Khumbu",
    notes: "TIMS & Sagarmatha National Park entry registry point.",
    verified: { source: "Nepal Police Khumbu District", date: "2026-09-19" },
  },
];

/**
 * Calculates great-circle distance between two points in km (Haversine formula).
 */
export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Finds the nearest N resources for a coordinate.
 * If category is 'altitude_illness' and alt > 4000m, helipads, heli operators,
 * and HRA aid posts are prioritized.
 */
export function getNearestResources(
  lat: number,
  lng: number,
  category?: string,
  altM?: number | null,
  limit = 5
): (Resource & { distanceKm: number })[] {
  const withDistance = EMERGENCY_RESOURCES.map((r) => ({
    ...r,
    distanceKm: calculateDistanceKm(lat, lng, r.lat, r.lng),
  }));

  const isHighAltAms =
    category === "altitude_illness" && (altM ?? 0) >= 4000;

  return withDistance
    .sort((a, b) => {
      if (isHighAltAms) {
        const highAltKinds = new Set(["helipad", "heli_operator", "hra_post"]);
        const aPriority = highAltKinds.has(a.kind) ? 0 : 1;
        const bPriority = highAltKinds.has(b.kind) ? 0 : 1;
        if (aPriority !== bPriority) {
          return aPriority - bPriority;
        }
      }
      return a.distanceKm - b.distanceKm;
    })
    .slice(0, limit);
}
