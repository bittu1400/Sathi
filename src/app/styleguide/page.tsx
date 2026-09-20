import type { Metadata } from "next";
import { Gallery } from "./Gallery";

export const metadata: Metadata = { title: "Styleguide", robots: { index: false, follow: false } };

export default function StyleguidePage() {
  return <Gallery />;
}
