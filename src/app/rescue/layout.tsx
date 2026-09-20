import React from "react";
import type { Metadata } from "next";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Rescue", robots: { index: false } };

export default async function RescueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard role: only coordinators can access the rescue dashboard
  await requireRole("coordinator");

  return <div className="flex h-dvh w-full flex-col overflow-hidden bg-bg text-text">{children}</div>;
}
