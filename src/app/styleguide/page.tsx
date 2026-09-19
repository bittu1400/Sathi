"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardBody } from "@/components/ui/card";
import { Stat } from "@/components/ui/stat";
import { Badge } from "@/components/ui/badge";
import { SeverityBanner } from "@/components/ui/severity-banner";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { ConnectivityPill } from "@/components/ui/connectivity-pill";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { ElevationProfile } from "@/components/trek/ElevationProfile";
import { AltitudeLadder } from "@/components/trek/AltitudeLadder";

export default function StyleguidePage() {
  const [chipSelected, setChipSelected] = React.useState(true);
  const [segmentedValue, setSegmentedValue] = React.useState<number>(1);

  const sampleWaypoints = [
    { id: "1", name: "Lukla", altitudeM: 2860, distanceKm: 0 },
    { id: "2", name: "Phakding", altitudeM: 2610, distanceKm: 7.5 },
    { id: "3", name: "Namche Bazaar", altitudeM: 3440, distanceKm: 18.5 },
    { id: "4", name: "Tengboche", altitudeM: 3860, distanceKm: 28.0 },
    { id: "5", name: "Dingboche", altitudeM: 4410, distanceKm: 38.5 },
    { id: "6", name: "Lobuche", altitudeM: 4940, distanceKm: 46.2 },
    { id: "7", name: "Gorak Shep", altitudeM: 5164, distanceKm: 51.5 },
    { id: "8", name: "Kala Patthar", altitudeM: 5645, distanceKm: 53.0 },
  ];

  const sampleNights = [
    { dayNumber: 4, placeName: "Tengboche", altitudeM: 3860, gainM: 420 },
    { dayNumber: 5, placeName: "Dingboche", altitudeM: 4410, gainM: 550 },
    { dayNumber: 6, placeName: "Dingboche (Rest)", altitudeM: 4410, gainM: 0 },
    { dayNumber: 7, placeName: "Lobuche", altitudeM: 4940, gainM: 530 },
  ];

  const colorTokens = [
    { name: "--bg", class: "bg-bg border-border text-text" },
    { name: "--surface", class: "bg-surface text-text" },
    { name: "--surface-2", class: "bg-surface-2 text-text" },
    { name: "--surface-3", class: "bg-surface-3 text-text" },
    { name: "--accent", class: "bg-accent text-accent-ink" },
    { name: "--ok", class: "bg-ok text-black" },
    { name: "--info", class: "bg-info text-black" },
    { name: "--caution", class: "bg-caution text-black" },
    { name: "--warning", class: "bg-warning text-black" },
    { name: "--danger", class: "bg-danger text-white" },
    { name: "--sos", class: "bg-sos text-sos-ink" },
  ];

  return (
    <div className="space-y-12 py-4">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-2">
          Design System & Component Gallery
        </h1>
        <p className="text-text-muted text-base">
          Summit Night design system tokens, typography, interactive UI components, and state variants.
        </p>
      </div>

      {/* 1. Color Palette Swatches */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          1. Color Swatches
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {colorTokens.map((token) => (
            <div
              key={token.name}
              className={`p-3 rounded-[var(--radius-sm)] border border-border flex flex-col justify-between h-20 shadow-sm ${token.class}`}
            >
              <span className="font-mono text-xs font-bold">{token.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Typography Scale */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          2. Typography Scale
        </h2>
        <div className="space-y-4 bg-surface p-6 rounded-[var(--radius)] border border-border">
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">Display (44px)</span>
            <p className="text-4xl font-extrabold tracking-tight">5,645 m Kala Patthar</p>
          </div>
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">H1 (32px)</span>
            <h1 className="text-3xl font-bold">Everest Base Camp Trek</h1>
          </div>
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">H2 (24px)</span>
            <h2 className="text-2xl font-semibold">Stage 7: Dingboche to Lobuche</h2>
          </div>
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">Body (16px)</span>
            <p className="text-base text-text">
              High altitude safety guidance and automated AMS monitoring for high passes in Nepal.
            </p>
          </div>
          <div>
            <span className="text-xs font-mono text-text-muted block mb-1">Micro / Labels (12px Mono)</span>
            <p className="text-xs font-mono uppercase tracking-widest text-text-muted">
              LAT 27.9807° N · LNG 86.8290° E
            </p>
          </div>
        </div>
      </section>

      {/* 3. Buttons */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          3. Buttons
        </h2>
        <div className="flex flex-wrap items-center gap-4">
          <Button variant="primary">Primary Accent</Button>
          <Button variant="secondary">Secondary Surface</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="sos" size="lg">
            Start SOS
          </Button>
          <Button variant="primary" loading>
            Loading State
          </Button>
        </div>
      </section>

      {/* 4. Stats & Badges */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          4. Stats & Badges
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <Stat
              label="Current Altitude"
              value="4,940"
              unit="m"
              delta={{ text: "+530 m since last night", severity: "caution" }}
            />
          </Card>
          <Card>
            <Stat
              label="Distance Walked"
              value="14.2"
              unit="km"
              delta={{ text: "On schedule", severity: "ok" }}
            />
          </Card>
          <Card>
            <Stat
              label="Heart Rate"
              value="92"
              unit="bpm"
              delta={{ text: "Elevated at resting", severity: "warning" }}
            />
          </Card>
        </div>

        <div className="flex flex-wrap gap-2 pt-2">
          <Badge variant="neutral">Neutral Badge</Badge>
          <Badge variant="ok">Normal / OK</Badge>
          <Badge variant="info">Information</Badge>
          <Badge variant="caution">Caution (R6 Gain)</Badge>
          <Badge variant="warning">Warning (AMS Risk)</Badge>
          <Badge variant="danger">Danger / Critical</Badge>
          <Badge variant="unverified">Unverified Resource</Badge>
        </div>
      </section>

      {/* 5. Severity Banners */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          5. Severity Banners (Alerts)
        </h2>
        <div className="space-y-3">
          <SeverityBanner
            severity="info"
            headline="Acclimatization Day Scheduled"
            reasons={["You have completed 2 nights at Namche Bazaar (3,440 m)."]}
          />
          <SeverityBanner
            severity="caution"
            headline="Sleeping Altitude Gain Caution (+530 m)"
            reasons={[
              "Sleeping gain between Dingboche and Lobuche exceeds the 500 m guideline.",
            ]}
          />
          <SeverityBanner
            severity="warning"
            headline="Mild Altitude Sickness Warning (LLS 5)"
            reasons={[
              "Headache present (score 2)",
              "Dizziness / lightheadedness (score 2)",
            ]}
            disclaimer="Do not ascend higher. Rest at current altitude until symptoms resolve."
            actions={<Button size="sm" variant="secondary">View Local Clinics</Button>}
          />
          <SeverityBanner
            severity="danger"
            headline="SEVERE AMS / HAPE RISK — DESCEND IMMEDIATELY"
            reasons={[
              "Red flag detected: Loss of balance / ataxia",
              "Severe headache unresponsive to medication",
            ]}
            disclaimer="Medical emergency. Descend at least 500m to lower altitude immediately."
            actions={
              <Button size="sm" variant="sos">
                Trigger SOS Rescue
              </Button>
            }
          />
        </div>
      </section>

      {/* 6. Form Controls & Selectors */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          6. Interactive Controls
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Connectivity Status</h3>
            </CardHeader>
            <CardBody className="flex flex-wrap gap-3">
              <ConnectivityPill status="online" />
              <ConnectivityPill status="offline" queuedCount={3} />
              <ConnectivityPill status="syncing" />
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="font-semibold text-sm">Filter Chips</h3>
            </CardHeader>
            <CardBody>
              <ChipGroup>
                <Chip
                  selected={chipSelected}
                  onClick={() => setChipSelected(!chipSelected)}
                >
                  High Altitude ({chipSelected ? "On" : "Off"})
                </Chip>
                <Chip selected={false}>Alpine Pass</Chip>
                <Chip selected={false}>Glacier</Chip>
              </ChipGroup>
            </CardBody>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <h3 className="font-semibold text-sm">
              Segmented Symptom Rating (Lake Louise Score)
            </h3>
          </CardHeader>
          <CardBody>
            <Segmented
              value={segmentedValue}
              onChange={setSegmentedValue}
              options={[
                { value: 0, label: "None" },
                { value: 1, label: "Mild" },
                { value: 2, label: "Moderate" },
                { value: 3, label: "Severe" },
              ]}
            />
          </CardBody>
        </Card>
      </section>

      {/* 7. Specialized Trek Visualizations */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          7. Trek Visualizations
        </h2>
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-2">Elevation Profile (Everest Base Camp)</h3>
            <ElevationProfile waypoints={sampleWaypoints} currentDistanceKm={38.5} />
          </div>

          <div>
            <h3 className="text-sm font-semibold mb-2">Altitude Ladder</h3>
            <AltitudeLadder nights={sampleNights} />
          </div>
        </div>
      </section>

      {/* 8. Utility States */}
      <section className="space-y-4">
        <h2 className="text-xl font-semibold border-b border-border pb-2">
          8. Empty & Skeleton States
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <EmptyState
            title="No Saved Offline Map Packs"
            description="Download map tiles for Everest Base Camp or Annapurna to view maps offline on the trail."
            action={<Button size="sm">Download Pack</Button>}
          />
          <Card className="space-y-3">
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-20 w-full" />
          </Card>
        </div>
      </section>
    </div>
  );
}
