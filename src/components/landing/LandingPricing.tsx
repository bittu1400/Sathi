import { Check } from "lucide-react";
import { Panel } from "../ui/panel";
import { Status } from "../ui/status";

// Prices from PLAN §5. Nothing can be bought yet: there is no /pass screen and
// no payment route, so these are marked Upcoming and carry no CTA.
const paid = [
  {
    name: "Trek Pass",
    price: "from $19",
    period: "7, 14 or 30 trek days · NPR 2,500+ via eSewa",
    note: "The clock starts on the trail, not at purchase.",
    features: ["Everything free", "Offline topo map packs", "Altitude-adjusted weather with pass go/no-go"],
  },
  {
    name: "Annual Pro",
    price: "$69",
    period: "per year",
    note: "For guides and repeat trekkers.",
    features: ["Everything in Trek Pass", "Unlimited trek days for 365 days"],
  },
];

const free = [
  "The route recommender and its day plans",
  "Community boards",
  "One-tap SOS with SMS fallback",
  "Daily Lake Louise check-ins",
  "Altitude-sickness guidance and alerts",
  "Emergency directory",
  "Family live share link",
  "Fallback route map and waypoints",
];

export function LandingPricing() {
  return (
    <section id="pricing" className="scroll-mt-20 space-y-4 py-8">
      <h2 className="text-h1">Safety is always free</h2>
      <p className="max-w-2xl text-text-muted">
        Planning is free too. The paid tiers below are not built yet — there is nothing to buy on
        this site today.
      </p>
      <Panel title="Free for everyone" meta="Forever">
        <ul className="grid gap-2 sm:grid-cols-2">
          {free.map((f) => (
            <li key={f} className="flex items-center gap-2 text-body">
              <Check className="size-4 shrink-0 text-ok" aria-hidden /> {f}
            </li>
          ))}
        </ul>
      </Panel>
      <div className="grid gap-4 md:grid-cols-2">
        {paid.map((t) => (
          <Panel key={t.name} title={t.name} meta={<Status unverified>Upcoming</Status>} className="space-y-3">
            <p className="flex flex-wrap items-baseline gap-2">
              <span className="text-readout">{t.price}</span>
              <span className="text-small text-text-muted">{t.period}</span>
            </p>
            <p className="text-text-muted">{t.note}</p>
            <ul className="space-y-1.5 border-t border-line pt-3">
              {t.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-body">
                  <Check className="size-4 shrink-0 text-text-muted" aria-hidden /> {f}
                </li>
              ))}
            </ul>
          </Panel>
        ))}
      </div>
    </section>
  );
}
