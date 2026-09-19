import Link from "next/link";
import { Button } from "../ui/button";
import { Panel } from "../ui/panel";

export function LandingAgencies() {
  return (
    <section className="py-8">
      <Panel title="For agencies and rescue coordinators" className="space-y-3">
        <p className="max-w-2xl text-text-muted">
          A live console shows every open SOS with the trekker&apos;s last position, emergency contact and latest check-in. Coordinators acknowledge and resolve incidents from a phone or a desk. Agencies see the trekkers linked to them.
        </p>
        <Button asChild variant="secondary">
          <Link href="/login">Sign in to the console</Link>
        </Button>
      </Panel>
    </section>
  );
}
