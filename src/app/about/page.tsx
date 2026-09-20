import type { Metadata } from "next";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingCapabilities } from "@/components/landing/LandingCapabilities";
import { LandingSos } from "@/components/landing/LandingSos";
import { LandingAgencies } from "@/components/landing/LandingAgencies";
import { LandingPricing } from "@/components/landing/LandingPricing";

export const metadata: Metadata = {
  title: "About",
  description: "Offline-first route intelligence, AMS monitoring, data-free SOS & live rescue dashboard.",
};

export default function AboutPage() {
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
