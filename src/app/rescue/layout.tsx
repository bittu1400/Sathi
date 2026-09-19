import React from "react";
import { requireRole } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RescueLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Guard role: only coordinators can access the rescue dashboard
  await requireRole("coordinator");

  return (
    <div className="h-screen w-screen flex flex-col bg-bg text-text overflow-hidden">
      {children}
    </div>
  );
}
