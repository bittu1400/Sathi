import type { Metadata } from "next";

export const metadata: Metadata = { title: "Trek", robots: { index: false } };

export default function TrekLayout({ children }: { children: React.ReactNode }) {
  return children;
}
