"use client";

import "./globals.css";

// Replaces the root layout when it fails, so it brings its own html/body.
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body className="flex min-h-dvh items-center justify-center bg-bg p-6 text-text">
        <div className="max-w-md space-y-4">
          <h1 className="text-h1">Sathi couldn&apos;t start</h1>
          <p className="text-text-muted">Something broke while loading the app. Try again.</p>
          <button
            type="button"
            onClick={() => retry()}
            className="h-12 cursor-pointer rounded-[var(--radius)] bg-accent px-5 text-body font-medium text-ink"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
