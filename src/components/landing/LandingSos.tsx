import { Panel } from "../ui/panel";
import { SOS_DISCLAIMER } from "@/lib/ams-copy";

const steps = [
  { n: "1", title: "Tap SOS", body: "A 5-second countdown gives you time to cancel a mistake." },
  { n: "2", title: "Signed in: sent at once", body: "Coordination receives your position and your emergency contact. You see when it's acknowledged." },
  { n: "3", title: "No data, or no account: you press Send", body: "The SOS is saved on your phone. A message with your position opens in SMS, WhatsApp or the dialler, and you press Send — nothing leaves the phone by itself." },
];

export function LandingSos() {
  return (
    <section id="sos" className="scroll-mt-20 space-y-4 py-8">
      <h2 className="text-h1">How SOS works without data</h2>
      <ol className="grid gap-4 md:grid-cols-3">
        {steps.map((s) => (
          <li key={s.n}>
            <Panel className="h-full space-y-2">
              <p className="font-mono text-h2 text-text-muted">{s.n}</p>
              <h3 className="text-h2">{s.title}</h3>
              <p className="text-text-muted">{s.body}</p>
            </Panel>
          </li>
        ))}
      </ol>
      <p className="max-w-3xl text-body text-text-muted">
        SMS still needs a mobile signal, and standard rates may apply. {SOS_DISCLAIMER}
      </p>
    </section>
  );
}
