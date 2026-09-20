"use client";

import * as React from "react";
import { MapPin, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Readout } from "@/components/ui/readout";
import { Status, type StatusTone } from "@/components/ui/status";
import { Banner, type SeverityLevel } from "@/components/ui/banner";
import { Chip, ChipGroup } from "@/components/ui/chip";
import { Segmented } from "@/components/ui/segmented";
import { ConnectivityPill } from "@/components/ui/connectivity-pill";
import { EmptyState, ErrorState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Fact, FactList } from "@/components/ui/fact";
import { Table, TableCards, type Column } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Kbd } from "@/components/ui/kbd";
import { Progress, Spinner } from "@/components/ui/spinner";
import { Logo } from "@/components/ui/logo";
import { ElevationProfile } from "@/components/trek/ElevationProfile";
import { AltitudeLadder } from "@/components/trek/AltitudeLadder";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "@/components/ui/toast";
import { runWithUndo } from "@/components/ui/use-undo";
import { SaveState } from "@/components/ui/save-state";

const waypoints = [
  { id: "1", name: "Lukla", altitudeM: 2860, distanceKm: 0 },
  { id: "2", name: "Phakding", altitudeM: 2610, distanceKm: 7.5 },
  { id: "3", name: "Namche Bazaar", altitudeM: 3440, distanceKm: 18.5 },
  { id: "4", name: "Tengboche", altitudeM: 3860, distanceKm: 28.0 },
  { id: "5", name: "Dingboche", altitudeM: 4410, distanceKm: 38.5 },
  { id: "6", name: "Lobuche", altitudeM: 4940, distanceKm: 46.2 },
  { id: "7", name: "Gorak Shep", altitudeM: 5164, distanceKm: 51.5 },
  { id: "8", name: "Kala Patthar", altitudeM: 5645, distanceKm: 53.0 },
];
const nights = [
  { dayNumber: 4, placeName: "Tengboche", altitudeM: 3860, gainM: 420 },
  { dayNumber: 5, placeName: "Dingboche", altitudeM: 4410, gainM: 550 },
  { dayNumber: 6, placeName: "Dingboche (Rest)", altitudeM: 4410, gainM: 0 },
  { dayNumber: 7, placeName: "Lobuche", altitudeM: 4940, gainM: 530 },
];
const swatches = [
  ["bg", "bg-bg text-text"],
  ["surface", "bg-surface text-text"],
  ["surface-2", "bg-surface-2 text-text"],
  ["surface-3", "bg-surface-3 text-text"],
  ["accent", "bg-accent text-ink"],
  ["ok", "bg-ok text-ink"],
  ["caution", "bg-caution text-ink"],
  ["warning", "bg-warning text-ink"],
  ["danger", "bg-danger text-ink"],
  ["sos", "bg-sos text-ink"],
] as const;
const tones: StatusTone[] = ["neutral", "ok", "caution", "warning", "danger", "sos", "accent"];
const levels: SeverityLevel[] = ["info", "caution", "warning", "danger", "sos"];

interface Row {
  name: string;
  alt: number;
  days: number;
}
const rows: Row[] = [
  { name: "Everest Base Camp", alt: 5364, days: 12 },
  { name: "Annapurna Circuit", alt: 5416, days: 14 },
  { name: "Poon Hill", alt: 3210, days: 4 },
];
const columns: Column<Row>[] = [
  { key: "name", header: "Route", cell: (r) => r.name, sortKey: "name" },
  { key: "alt", header: "Max altitude", numeric: true, cell: (r) => `${r.alt.toLocaleString("en-US")} m`, sortKey: "alt" },
  { key: "days", header: "Days", numeric: true, cell: (r) => r.days },
];

function Section({ n, title, children }: { n: number; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <h2 className="border-b border-line pb-2 text-h2">
        {n}. {title}
      </h2>
      {children}
    </section>
  );
}

export function Gallery() {
  const [chip, setChip] = React.useState(true);
  const [seg, setSeg] = React.useState(1);
  const [sort, setSort] = React.useState<{ key: string; dir: "asc" | "desc" }>({ key: "name", dir: "asc" });
  const [confirm, setConfirm] = React.useState(false);
  const sorted = [...rows].sort((a, b) => {
    const k = sort.key as keyof Row;
    return (a[k] < b[k] ? -1 : 1) * (sort.dir === "asc" ? 1 : -1);
  });

  return (
    <div className="space-y-12 py-4">
      <header className="space-y-2">
        <Logo />
        <h1 className="text-h1">Instrument: tokens and components</h1>
        <p className="text-text-muted">Dark only. Every primitive in every state. Not linked from the app.</p>
      </header>

      <Section n={1} title="Colour">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {swatches.map(([name, cls]) => (
            <div key={name} className={`flex h-20 items-end rounded-[var(--radius)] border border-line p-3 ${cls}`}>
              <span className="font-mono text-small">--{name}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section n={2} title="Type">
        <Panel className="space-y-3">
          <p className="text-readout-xl">4,940 m</p>
          <p className="text-readout">+530 m</p>
          <p className="text-display">Display 40/44</p>
          <p className="text-h1">H1 24/30</p>
          <p className="text-h2">H2 18/24</p>
          <p className="text-body">Body 15/22. The quick brown fox jumps over the lazy dog.</p>
          <p className="text-small text-text-muted">Small 13/18, metadata and dense table cells.</p>
          <p className="text-label text-text-muted">Label 12/16</p>
        </Panel>
      </Section>

      <Section n={3} title="Buttons">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
          <Button variant="sos" size="lg">
            Send SOS
          </Button>
          <Button size="sm">Small (consoles)</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button state="busy">Saving</Button>
          <Button state="done">Saved</Button>
          <Button state="error" variant="secondary">
            Retry
          </Button>
          <Button variant="sos" size="sos" aria-label="SOS">
            SOS
          </Button>
          <Button asChild variant="secondary">
            <a href="#forms">Link as button</a>
          </Button>
        </div>
      </Section>

      <Section n={4} title="Status, chips, connectivity">
        <div className="flex flex-wrap gap-2">
          {tones.map((t) => (
            <Status key={t} tone={t}>
              {t}
            </Status>
          ))}
          {tones.map((t) => (
            <Status key={`s-${t}`} tone={t} variant="solid">
              {t}
            </Status>
          ))}
          <Status unverified>unverified</Status>
        </div>
        <ChipGroup>
          <Chip selected={chip} onClick={() => setChip(!chip)}>
            Under 10 days
          </Chip>
          <Chip>Moderate</Chip>
        </ChipGroup>
        <div className="flex flex-wrap gap-2">
          <ConnectivityPill />
          <ConnectivityPill status="offline" queuedCount={3} />
          <ConnectivityPill status="syncing" />
        </div>
      </Section>

      <Section n={5} title="Readouts and facts">
        <div className="grid gap-4 md:grid-cols-2">
          <Panel title="Altitude" meta="Today">
            <Readout size="xl" label="Current" value="4,940" unit="m" delta={{ text: "+530 m today", severity: "warning" }} freshness="updated 2 min ago · ±25 m" />
          </Panel>
          <Panel title="Route" meta="EBC">
            <div className="mb-4 grid grid-cols-3 gap-4">
              <Readout size="md" label="Max" value="5,364" unit="m" />
              <Readout size="md" label="Days" value="12" />
              <Readout size="md" label="Gain" value="7,400" unit="m" />
            </div>
            <FactList>
              <Fact label="Start point">Lukla</Fact>
              <Fact label="Permits">Sagarmatha NP, Khumbu</Fact>
            </FactList>
          </Panel>
        </div>
      </Section>

      <Section n={6} title="Banners">
        <div className="grid gap-3 md:grid-cols-2">
          {levels.map((l) => (
            <Banner key={l} severity={l} headline={`${l} banner`} reasons={["Reason one", "Reason two"]} disclaimer="Disclaimer text lives in ams-copy.ts." />
          ))}
        </div>
      </Section>

      <Section n={7} title="Forms">
        <div id="forms" className="grid gap-4 md:grid-cols-2">
          <Field label="Name" hint="As on your passport." required>
            {(p) => <Input {...p} placeholder="Maya Tamang" autoComplete="name" />}
          </Field>
          <Field label="Phone" error="Enter a number in international format.">
            {(p) => <Input {...p} defaultValue="98" inputMode="tel" />}
          </Field>
          <Field label="Experience">
            {(p) => (
              <Select {...p}>
                <option>First trek</option>
                <option>Some experience</option>
              </Select>
            )}
          </Field>
          <Field label="Notes">{(p) => <Textarea {...p} />}</Field>
        </div>
        <Segmented
          aria-label="Headache"
          value={seg}
          onChange={setSeg}
          options={[
            { value: 0, label: "None" },
            { value: 1, label: "Mild" },
            { value: 2, label: "Moderate" },
            { value: 3, label: "Severe" },
          ]}
        />
      </Section>

      <Section n={8} title="Table and tabs">
        <div className="hidden md:block">
          <Table
            caption="Routes"
            columns={columns}
            rows={sorted}
            rowKey={(r) => r.name}
            sort={{ ...sort, onSort: (key) => setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" })) }}
          />
        </div>
        <div className="md:hidden">
          <TableCards columns={columns} rows={sorted} rowKey={(r) => r.name} />
        </div>
        <Tabs defaultValue="open">
          <TabsList>
            <TabsTrigger value="open">Open · 2</TabsTrigger>
            <TabsTrigger value="ack">Acknowledged · 1</TabsTrigger>
          </TabsList>
          <TabsContent value="open" className="pt-3 text-text-muted">
            Open incidents. Shortcut <Kbd>J</Kbd> <Kbd>K</Kbd>
          </TabsContent>
          <TabsContent value="ack" className="pt-3 text-text-muted">
            Acknowledged incidents.
          </TabsContent>
        </Tabs>
      </Section>

      <Section n={9} title="Feedback states">
        <div className="grid gap-4 md:grid-cols-3">
          <EmptyState title="No trekkers linked yet" description="Invite trekkers from your agency." icon={<MapPin className="size-6 text-text-muted" />} />
          <ErrorState title="Couldn't load routes" description="Check your connection, then retry." onRetry={() => undefined} icon={<TriangleAlert />} />
          <Panel className="space-y-3">
            <Skeleton shape="readout" />
            <Skeleton shape="line" />
            <Skeleton shape="row" />
            <div className="flex items-center gap-3">
              <Spinner />
              <Progress value={42} valueText="42% of 38 MB" />
            </div>
          </Panel>
        </div>
      </Section>

      <Section n={10} title="Overlays and feedback">
        <div className="flex flex-wrap items-center gap-3">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="secondary">Dialog</Button>
            </DialogTrigger>
            <DialogContent title="Dialog" description="Centred from 768 px, a bottom sheet below.">
              <Button>Primary action</Button>
            </DialogContent>
          </Dialog>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="secondary">Sheet</Button>
            </SheetTrigger>
            <SheetContent title="Sheet" description="Bottom sheet on mobile, right panel on desktop.">
              <p className="text-text-muted">Check-in, filters, marker details.</p>
            </SheetContent>
          </Sheet>
          <Button variant="danger" onClick={() => setConfirm(true)}>
            Confirm dialog
          </Button>
          <ConfirmDialog
            open={confirm}
            onOpenChange={setConfirm}
            title="Delete my data?"
            body="This removes your profile and treks. It can't be undone."
            confirmLabel="Delete data"
            tone="danger"
            requireText="DELETE"
            onConfirm={() => undefined}
          />
          <Button variant="secondary" onClick={() => toast.success("Link copied")}>
            Toast
          </Button>
          <Button variant="secondary" onClick={() => toast.error("Couldn't sync — will retry")}>
            Error toast
          </Button>
          <Button variant="secondary" onClick={() => runWithUndo({ apply: () => undefined, revert: () => undefined, commit: () => undefined, message: "Pack removed" })}>
            Undo toast
          </Button>
        </div>
        <div className="flex flex-wrap gap-6">
          <SaveState state="saving" />
          <SaveState state="saved" />
          <SaveState state="queued" />
          <SaveState state="error" onRetry={() => undefined} />
        </div>
      </Section>

      <Section n={11} title="Trek components">
        <ElevationProfile waypoints={waypoints} currentDistanceKm={38.5} />
        <AltitudeLadder nights={nights} />
      </Section>
    </div>
  );
}
