import { Panel } from "../ui/panel";
import { Status } from "../ui/status";

export function LandingAgencies() {
  return (
    <section className="py-8">
      <Panel
        title="For agencies and rescue coordinators"
        meta={<Status unverified>Upcoming</Status>}
        className="space-y-3"
      >
        <p className="max-w-2xl text-text-muted">
          A live console that shows every open SOS with the trekker&apos;s last position, emergency
          contact and latest check-in, for coordinators to acknowledge and resolve. It is built but
          not open: it needs agency accounts nobody has set up yet, so there is nothing to sign in
          to from here.
        </p>
      </Panel>
    </section>
  );
}
