import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-16">
      <p className="text-label text-text-muted">404</p>
      <h1 className="text-h1">This page doesn&apos;t exist</h1>
      <p className="text-text-muted">The link may be old or mistyped.</p>
      <div className="flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/routes">Browse routes</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/sos">Open SOS</Link>
        </Button>
      </div>
    </div>
  );
}
