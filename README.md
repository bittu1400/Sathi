# Sathi

*Sathi (साथी) means "companion" in Nepali.*

**Trek higher. Come home.** An offline-first safety companion for trekking in Nepal.

> 🚧 Being built during a hackathon. This README will be finalized with screenshots and setup steps (task C-11).

## What it does
- **Route intelligence:** curated Himalayan routes with elevation profiles, stages, permits, hazards, and emergency resources along the trail.
- **Offline packs:** download a route's map and emergency data once, then use it with zero signal.
- **Altitude watch:** tracks daily sleeping-altitude gain and Lake Louise symptom check-ins against published Wilderness Medical Society guidance, using deterministic rules (no AI in the safety loop).
- **Altitude-adjusted weather:** forecasts at the waypoint's elevation, with go/no-go guidance for high passes.
- **One-tap SOS:** sends location, altitude and situation live when online, or prepares a pre-filled SMS and queues the alert when offline.
- **Rescue dashboard:** a live incident map with trekker context and the nearest aid posts, hospitals and helipads.
- **Family share link:** a read-only live view of the trek, no app needed.

## Stack
Next.js · TypeScript · Tailwind CSS · MapLibre GL + PMTiles (Protomaps) · Supabase · Open-Meteo · eSewa (test) · Vercel

## Getting started
```bash
pnpm install
cp .env.example .env.local   # fill in values
pnpm dev
```

## Contributing
See [CONTRIBUTING.md](CONTRIBUTING.md). AI agents: see [CLAUDE.md](CLAUDE.md).

## Safety disclaimer
Sathi provides general safety information and helps you share your location. It does not provide medical diagnosis or guarantee rescue. In an emergency, descend if you can do so safely, and contact local rescue services directly. If in doubt, go down.

## Credits
Map data © OpenStreetMap contributors. Basemap by Protomaps. Weather by Open-Meteo.
