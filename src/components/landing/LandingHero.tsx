import Link from "next/link";
import { Button } from "../ui/button";
import { Panel } from "../ui/panel";
import { Readout } from "../ui/readout";
import { Banner } from "../ui/banner";
import { ElevationProfile } from "../trek/ElevationProfile";
import { profileTicks } from "../trek/profile-ticks";
import { getRoute } from "@/lib/data";
import type { RouteDetail } from "@/lib/types";
import { GAIN_CAUTION_ACTIONS, GAIN_CAUTION_HEADLINE } from "@/lib/ams-copy";
import { formatAltitude, formatGain } from "@/lib/format";

export function LandingHero() {
  const ticks = profileTicks(getRoute("ebc") as RouteDetail);
  return (
    <section className="grid items-center gap-8 py-8 lg:grid-cols-2 lg:gap-12 lg:py-16">
      <div className="space-y-6">
        <h1 className="text-display">Say where you want to go. We draw the way.</h1>
        <p className="max-w-xl text-h2 font-normal text-text-muted">
          Tell Sathi a place, how many days you have and what you want to see. It draws the routes
          on the map, splits them into days, and names what you walk past. Then it watches your
          altitude and gets an SOS out when the signal is gone.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg">
            <Link href="/">Plan a route</Link>
          </Button>
          <Button asChild size="lg" variant="secondary">
            <a href="#sos">How SOS works</a>
          </Button>
        </div>
        <p className="text-small text-text-muted">
          No account needed to plan. SOS, check-ins and altitude-sickness guidance are free, always.
        </p>
      </div>

      {/* Built from the real components: EBC day 5 (Tengboche 3,860 m to Dingboche 4,410 m) and the real guidance text. */}
      <Panel title="Example day" meta="Everest Base Camp" aria-label="Example of the trek screen" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Readout size="md" label="Sleeping altitude" value="4,410" unit="m" delta={{ text: `${formatGain(550)} since last night`, severity: "caution" }} />
          <Readout size="md" label="Trek day" value="5" delta={{ text: "Tengboche to Dingboche" }} />
        </div>
        <Banner severity="caution" headline={GAIN_CAUTION_HEADLINE} reasons={GAIN_CAUTION_ACTIONS.slice(0, 2)} />
        <div>
          <p className="mb-2 text-label text-text-muted">Route profile · max {formatAltitude(Math.max(...ticks.map((t) => t.altitudeM)))}</p>
          <ElevationProfile waypoints={ticks} />
        </div>
      </Panel>
    </section>
  );
}
