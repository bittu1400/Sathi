import * as React from "react";
import { Mountain, WifiOff, ShieldAlert } from "lucide-react";
import { Card, CardHeader, CardBody } from "../ui/card";

export function LandingPillars() {
  const pillars = [
    {
      icon: <Mountain className="w-8 h-8 text-accent" />,
      title: "Knows Your Altitude",
      description:
        "Deterministic AMS rules engine evaluating daily sleeping altitude gain against WMS clinical guidelines. Detects early symptoms before they worsen.",
    },
    {
      icon: <WifiOff className="w-8 h-8 text-caution" />,
      title: "Works Without Signal",
      description:
        "100% offline functionality. PMTiles vector basemaps, route elevation profiles, and emergency directories stored directly on your device.",
    },
    {
      icon: <ShieldAlert className="w-8 h-8 text-sos" />,
      title: "Gets Help Moving",
      description:
        "One-tap SOS triggering with 5s countdown, automated SMS fallback formatted with exact GPS coordinates, and real-time coordinator dispatch view.",
    },
  ];

  return (
    <section className="space-y-6 mb-16">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Built for High-Altitude Survival
        </h2>
        <p className="text-sm text-text-muted">
          Designed specifically for Nepal&apos;s Himalayan trails where cellular data drops and altitude risks increase.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {pillars.map((p, idx) => (
          <Card key={idx} className="hover:border-accent/50 transition-all">
            <CardHeader>
              <div className="p-3 bg-surface-2 rounded-2xl border border-border w-fit mb-2">
                {p.icon}
              </div>
              <h3 className="font-semibold text-lg text-text">{p.title}</h3>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-text-muted leading-relaxed">
                {p.description}
              </p>
            </CardBody>
          </Card>
        ))}
      </div>
    </section>
  );
}
