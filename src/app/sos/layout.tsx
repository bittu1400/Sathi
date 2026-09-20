import type { Metadata } from "next";

export const metadata: Metadata = { title: "SOS", robots: { index: false } };

export default function SosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
