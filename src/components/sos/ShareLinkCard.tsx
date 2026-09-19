"use client";

import React from "react";
import { Copy, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Panel } from "@/components/ui/panel";
import { Status } from "@/components/ui/status";
import { toast } from "@/components/ui/toast";

interface ShareLinkCardProps {
  shareToken: string;
  className?: string;
}

/** Family share is free (Q1). Pausing and regenerating the link need data-layer support that doesn't exist yet. */
export function ShareLinkCard({ shareToken, className }: ShareLinkCardProps) {
  const url = () => `${window.location.origin}/share/${shareToken}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url());
      toast.success("Link copied");
    } catch {
      toast.error("Couldn't copy the link. Long-press to copy it from the share sheet.");
    }
  };

  const share = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Follow my trek on Sathi", text: "My live trekking status on Sathi.", url: url() });
      } catch {
        // cancelled: nothing to report
      }
      return;
    }
    await copy();
  };

  return (
    <Panel title="Family share link" meta={<Status tone="ok">Free</Status>} className={className}>
      <div className="space-y-3">
        <p className="text-body text-text-muted">
          Family can see your route, altitude, last sleeping altitude and whether an SOS is open. Your position is rounded to about 100 m. They never see symptoms or contacts.
        </p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={share}>
            <Share2 className="size-4" aria-hidden /> Share with family
          </Button>
          <Button variant="secondary" onClick={copy} aria-label="Copy link">
            <Copy className="size-4" aria-hidden /> Copy
          </Button>
        </div>
      </div>
    </Panel>
  );
}
