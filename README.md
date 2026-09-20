# Sathi (साथी) — Offline-First Trekking Safety Companion for Nepal

> **Trek higher. Come home.**  
> Built for the Himalayas where cell towers end and safety decisions are matter-of-life.

---

## What is Sathi?

Trekkers in Nepal's high mountains are exposed to Acute Mountain Sickness (AMS), High Altitude Pulmonary Edema (HAPE) and High Altitude Cerebral Edema (HACE). Above Namche Bazaar or Manang, mobile connectivity is frequently patchy or non-existent. Existing trekking apps assume reliable internet connection, and during emergencies, vital coordinates, altitude readings, symptom trends, and nearby medical posts are scattered or inaccessible.

**Sathi (Nepali for *companion*)** is an offline-first progressive web application engineered specifically for the rugged terrain of Nepal. It tracks altitude gain, evaluates altitude illness symptoms against published Wilderness Medical Society guidelines, keeps trek mode and SOS working without a data signal, and coordinates live incident response with emergency services and family.

---

## Core Features

- **Route Recommender (`/`, the MVP core):** The app opens on a full-screen map. Say where you
  want to go, for how many days, and what you want to see — temples, mountains, villages,
  lakes — and Sathi draws the options with a day-by-day plan: distance, climb, walking hours,
  what each day passes and where it ends. A destination in a city becomes a **day out**, a
  walking loop through a set of places; anywhere else becomes a **trek**, a line split into
  days. No sign-in anywhere on that path. Routing by OpenRouteService, places from
  OpenStreetMap, basemap by CARTO.
- **Route & Topo Intelligence:** Curated Himalayan routes (full data for Everest Base Camp today; more routes as their data is verified) with maps, elevation profiles, acclimatization stages, and an emergency directory that marks unverified entries.
- **Deterministic Altitude Watch:** Pure TypeScript rules engine implementing the 2018 Lake Louise Score (LLS) and Wilderness Medical Society ascent guidelines. **Zero AI in the critical safety loop**—all advice is deterministic and unit-tested.
- **Offline Packs (PMTiles):** Single-file vector map packs and emergency directories downloaded in Kathmandu, accessible anywhere on the trail without cell reception.
- **One-Tap Emergency SOS:**
  - **Online:** Streams real-time distress signals to the Rescue Coordination Dashboard.
  - **Offline Fallback:** Automatically constructs a compact, 300-character cellular SMS with exact coordinates, altitude, LLS symptoms, and nearby HRA aid posts, while safely queuing the distress event in an IndexedDB outbox.
- **Rescue Coordination Command (`/rescue`):** Real-time command center for search-and-rescue teams featuring live Nepal Time (`Asia/Kathmandu`), Web Audio alert chimes, tactical map projections, and incident response tracking.
- **Agency Fleet Portal (`/agency`):** Live telemetry and health overview for trekking agencies managing multiple groups on the trail.
- **Family Live Share (`/share/[token]`):** Secure, tokenized public tracking link with 100-meter coordinate privacy rounding to keep loved ones informed without exposing raw medical records.
- **Stage Scenario Controller (`/demo`):** Built-in scenario runner to simulate the entire 3-minute trail journey without relying on indoor venue GPS.

---

## System Architecture

```
                ┌────────────────────────── Browser / Installed PWA ──────────────────────────┐
                │ Next.js 16 App Router Pages (React Leaf Components)                         │
                │  ├─ lib/ams.ts, weather.ts, alerts.ts, geo.ts   ← Pure logic, runs ON-DEVICE │
                │  ├─ lib/outbox.ts (IndexedDB via idb-keyval)    ← Queued writes when offline│
                │  ├─ lib/offline/packs.ts (IndexedDB Blobs)      ← PMTiles map file per route│
                │  └─ public/sw.js (Service Worker)               ← Shell & asset caching     │
                └──────────────┬───────────────────────────────┬──────────────────────────────┘
                               │ supabase-js (HTTPS + Realtime) │ fetch
                               ▼                                ▼
       ┌──────────── Supabase ────────────┐        ┌── Next.js Server (Vercel) ──┐   ┌ External ┐
       │ Postgres + RLS  (treks, positions,│        │ /api/pay/esewa/start        │──▶│ eSewa    │
       │ checkins, alerts, sos_events,     │◀───────│ /api/pay/esewa/callback     │   │ Open-Meteo
       │ passes, profiles, agencies)       │        │ /proxy.ts (Next 16 Session) │   └──────────┘
       │ Auth · Realtime · Storage(tiles)  │        └─────────────────────────────┘
       └───────────────────────────────────┘
```

---

## How Offline Resilience Works

1. **Client-First Outbox (`src/lib/outbox.ts`):** All telemetry (`positions`, `checkins`, `alerts`, `sos_events`) is written locally with client-generated UUIDs into IndexedDB. The outbox automatically drains to Supabase on reconnection with strict priority sorting (**SOS events always sync first**).
2. **Deterministic Edge Safety:** Lake Louise Score evaluations and altitude alerts run entirely in the browser's JavaScript runtime. You do not need a network connection to know whether it is safe to ascend.
3. **SMS Cellular Fallback:** When internet access is severed, Sathi's emergency engine encodes GPS coordinates, altitude, and symptom tags into a compact string (`smsBody()`) conforming to Nepal telecom SMS gateway limits.
4. **PMTiles Vector Basemaps:** Vector map tiles are bundled in self-contained PMTiles archives, eliminating the need for recurring map tile requests on the trail.

---

## Tech Stack

- **Framework:** Next.js 16.3 (App Router, Turbopack, strict TypeScript, Next 16 `src/proxy.ts` middleware)
- **Styling:** Tailwind CSS v4 with custom CSS variable design tokens
- **UI Primitives:** Radix UI (`shadcn/ui` base), `lucide-react` icons
- **Database & Auth:** Supabase (Postgres, Row Level Security, Realtime websockets, SSR auth)
- **Offline Storage:** `idb-keyval` (IndexedDB)
- **Mapping:** MapLibre GL JS + PMTiles + `@protomaps/basemaps`; CARTO vector basemaps on the planner
- **Route planning:** OpenRouteService (routing + geocoding) and Overpass / OpenStreetMap for places, both on free tiers
- **Validation:** Zod schemas
- **Testing:** Vitest with strict TypeScript compilation
- **Hosting:** Vercel (Production edge runtime)

---

## Getting Started Locally

### Prerequisites

- **Node.js:** 24+ (recommended via `.nvmrc`)
- **Package Manager:** `pnpm` 11+

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/bittu1400/Sathi.git
cd Sathi

# 2. Install dependencies
pnpm install

# 3. Configure environment variables
cp .env.example .env.local

# 4. Start the local development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Quality & Verification Command

Before opening pull requests, run the comprehensive verification pipeline:

```bash
pnpm check   # Executes: typecheck + eslint + vitest + next build
```

---

## Portals & Roles

| Route | Role / Access | Purpose |
|---|---|---|
| `/` | Public | **Route recommender** — the map-first planner, no sign-in |
| `/about` | Public | Product introduction, feature overview, and offline architecture |
| `/login` | Public | Authentication with one-click demo logins |
| `/trek` | Trekker (`trekker`) | Live trail companion: altitude HUD, next waypoint, symptom check-in, alerts |
| `/sos` | Trekker (`trekker`) | Emergency SOS activation, countdown cancel ring, and offline SMS fallback |
| `/rescue` | Coordinator (`coordinator`) | Tactical incident command workspace with real-time audio and map beacons |
| `/agency` | Agency Admin (`agency_admin`) | TAAN agency fleet management for tracking active trekkers on trail |
| `/share/[token]` | Public (Tokenized) | Family live share link with 100m privacy rounding and 60s auto-refresh |
| `/demo` | Operator (`NEXT_PUBLIC_DEMO=1`) | 3-minute pitch scenario controller for stage demonstrations |

---

## Safety Disclaimer

> **IMPORTANT:** Sathi provides general safety information and helps you share your location. It does not provide medical diagnosis or guarantee rescue. In an emergency, descend if you can do so safely, and contact local rescue services directly. If in doubt, go down.

---

## Credits & License

- **Team:** Built with passion for Nepal mountain safety.
- **Map Data:** © OpenStreetMap contributors. Basemap engine by Protomaps.
- **Weather Telemetry:** Open-Meteo API.
- **Medical Guidelines:** Wilderness Medical Society (WMS) & 2018 Lake Louise Score.
- **License:** MIT License.
