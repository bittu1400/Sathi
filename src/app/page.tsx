import * as React from "react";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCapabilities } from "@/components/landing/LandingCapabilities";
import { LandingSos } from "@/components/landing/LandingSos";
import { LandingAgencies } from "@/components/landing/LandingAgencies";
import { LandingPricing } from "@/components/landing/LandingPricing";

export default function HomePage() {
  return (
    <>
      <LandingHero />
      <LandingCapabilities />
      <LandingSos />
      <LandingAgencies />
      <LandingPricing />
    </>
  );
}
