import { Check, Minus } from "lucide-react";
import { Table, TableCards, type Column } from "../ui/table";

interface Capability {
  name: string;
  detail: string;
  offline: string;
  free: boolean;
}

// Only what works today and is free (FRONTEND-AUDIT §7). Altitude weather and offline map packs belong to Trek Pass (see LandingPricing) and are left out.
const rows: Capability[] = [
  { name: "SOS", detail: "One tap, 5-second cancel window", offline: "By SMS, needs phone signal", free: true },
  { name: "Altitude-sickness check-in", detail: "Lake Louise score and red flags", offline: "Yes", free: true },
  { name: "Altitude guidance and alerts", detail: "Sleeping-altitude gain and rest days", offline: "Yes", free: true },
  { name: "Emergency directory", detail: "Rescue posts, hospitals, helipads", offline: "Yes", free: true },
  { name: "Family live share link", detail: "Family sees your last position", offline: "Updates when you're online", free: true },
];

const yes = <Check className="inline size-4 text-ok" aria-label="Yes" />;
const columns: Column<Capability>[] = [
  { key: "name", header: "Capability", cell: (r) => <span className="font-medium">{r.name}</span> },
  { key: "detail", header: "What it does", cell: (r) => <span className="text-text-muted">{r.detail}</span> },
  { key: "offline", header: "Without data", cell: (r) => r.offline },
  { key: "free", header: "Free", cell: (r) => (r.free ? yes : <Minus className="inline size-4 text-text-muted" aria-label="No" />) },
];

export function LandingCapabilities() {
  return (
    <section id="capabilities" className="scroll-mt-20 space-y-4 py-8">
      <h2 className="text-h1">What Sathi does</h2>
      <div className="hidden md:block">
        <Table caption="Sathi capabilities" columns={columns} rows={rows} rowKey={(r) => r.name} />
      </div>
      <div className="md:hidden">
        <TableCards columns={columns} rows={rows} rowKey={(r) => r.name} />
      </div>
    </section>
  );
}
