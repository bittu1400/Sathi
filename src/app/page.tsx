import * as React from "react";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingPillars } from "@/components/landing/LandingPillars";
import { LandingOfflineSteps } from "@/components/landing/LandingOfflineSteps";
import { LandingPricing } from "@/components/landing/LandingPricing";
import { LandingFooter } from "@/components/landing/LandingFooter";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <LandingHero />
      <LandingPillars />
      <LandingOfflineSteps />
      <LandingPricing />
      <LandingFooter />
    </div>
  );
}
