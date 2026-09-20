"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-start gap-4 py-16">
      <h1 className="text-h1">Something went wrong</h1>
      <p className="text-text-muted">This screen failed to load. Try again, or go back to the routes.</p>
      <div className="flex flex-wrap gap-3">
        <Button onClick={() => retry()}>Try again</Button>
        <Button asChild variant="secondary">
          <Link href="/routes">Routes</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/sos">Open SOS</Link>
        </Button>
      </div>
    </div>
  );
}
