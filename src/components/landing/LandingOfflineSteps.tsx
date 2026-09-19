import * as React from "react";
import { Download, Compass, Smartphone } from "lucide-react";
import { Card } from "../ui/card";

export function LandingOfflineSteps() {
  const steps = [
    {
      step: "01",
      icon: <Download className="w-6 h-6 text-accent" />,
      title: "Download in Kathmandu",
      description:
        "Save high-resolution vector map packs for EBC, Annapurna, or Poon Hill to your phone before heading out into the mountains.",
    },
    {
      step: "02",
      icon: <Compass className="w-6 h-6 text-ok" />,
      title: "Trek with Zero Bars",
      description:
        "Log daily positions, track sleeping altitude gain, and evaluate Lake Louise scores completely offline on the trail.",
    },
    {
      step: "03",
      icon: <Smartphone className="w-6 h-6 text-sos" />,
      title: "SOS by SMS & Auto-Sync",
      description:
        "Trigger data-free emergency alerts via pre-formatted SMS to emergency contacts. All check-ins auto-sync when cellular signal returns.",
    },
  ];

  return (
    <section className="space-y-6 mb-16">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          How Offline Safety Works
        </h2>
        <p className="text-sm text-text-muted">
          Three simple steps to stay protected across Nepal&apos;s remote trekking regions.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {steps.map((s, idx) => (
          <Card key={idx} className="relative overflow-hidden bg-surface">
            <div className="absolute top-3 right-4 font-mono font-extrabold text-3xl text-surface-3 select-none">
              {s.step}
            </div>
            <div className="space-y-3">
              <div className="p-2.5 bg-surface-2 rounded-xl border border-border w-fit">
                {s.icon}
              </div>
              <h3 className="font-semibold text-base text-text">{s.title}</h3>
              <p className="text-sm text-text-muted leading-relaxed">
                {s.description}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
