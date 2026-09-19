import * as React from "react";
import Link from "next/link";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Card, CardHeader } from "../ui/card";
import { Check } from "lucide-react";

export function LandingPricing() {
  const tiers = [
    {
      name: "Explorer",
      price: "Free",
      period: "Forever",
      description: "Complete emergency safety loop for every trekker.",
      badge: "Free Safety",
      features: [
        "One-tap SOS with SMS fallback",
        "Daily Lake Louise AMS check-ins",
        "Altitude-sickness guidance and alerts",
        "Emergency resource directory",
        "Fallback route map & waypoints",
      ],
      buttonVariant: "secondary" as const,
      cta: "Get Started Free",
      href: "/routes",
    },
    {
      name: "Trek Pass",
      price: "from $19",
      period: "7, 14 or 30 trek days · NPR 2,500+ via eSewa",
      description: "Trail intelligence for the days you are actually on the trail.",
      badge: "Clock starts on the trail",
      popular: true,
      features: [
        "Everything in Explorer",
        "Offline topo map packs",
        "Altitude-adjusted weather with pass go/no-go",
        "Family live share link",
        "Personalized route finder",
      ],
      buttonVariant: "primary" as const,
      cta: "See Trek Pass",
      href: "/pass",
    },
    {
      name: "Annual Pro",
      price: "$69",
      period: "per year",
      description: "Unlimited trek days for guides and repeat trekkers.",
      badge: "Unlimited",
      features: ["Everything in Trek Pass", "Unlimited trek days for 365 days"],
      buttonVariant: "secondary" as const,
      cta: "See Annual Pro",
      href: "/pass",
    },
  ];

  return (
    <section className="space-y-6 mb-16">
      <div className="text-center space-y-2 max-w-2xl mx-auto">
        <Badge variant="ok" className="mb-1">
          Clock Starts on the Trail
        </Badge>
        <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
          Simple, Transparent Pricing
        </h2>
        <p className="text-sm text-text-muted">
          Safety features are 100% free forever. Upgrade for offline vector map packs and weather intelligence.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tiers.map((t, idx) => (
          <Card
            key={idx}
            className={`flex flex-col justify-between ${
              t.popular ? "border-accent ring-1 ring-accent/40 shadow-lg bg-surface" : ""
            }`}
          >
            <div className="space-y-4">
              <CardHeader className="flex flex-row items-center justify-between pb-0 border-none">
                <div>
                  <h3 className="font-bold text-xl text-text">{t.name}</h3>
                  <p className="text-xs text-text-muted">{t.description}</p>
                </div>
                <Badge variant={t.popular ? "ok" : "neutral"}>{t.badge}</Badge>
              </CardHeader>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-4xl font-extrabold text-text">{t.price}</span>
                <span className="text-xs text-text-muted font-sans">{t.period}</span>
              </div>

              <ul className="space-y-2 text-xs text-text-muted border-t border-border/60 pt-4">
                {t.features.map((feat, fIdx) => (
                  <li key={fIdx} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-ok shrink-0" />
                    <span>{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6">
              <Link href={t.href}>
                <Button variant={t.buttonVariant} className="w-full">
                  {t.cta}
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
