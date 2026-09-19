"use client";

import React, { useState } from "react";
import { Share2, Copy, Check } from "lucide-react";

interface ShareLinkCardProps {
  shareToken: string;
  className?: string;
}

export function ShareLinkCard({ shareToken, className = "" }: ShareLinkCardProps) {
  const [copied, setCopied] = useState(false);

  const getShareUrl = () => {
    if (typeof window !== "undefined") {
      return `${window.location.origin}/share/${shareToken}`;
    }
    return `/share/${shareToken}`;
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(getShareUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const handleNativeShare = async () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title: "Follow my Himalayan trek on Sathi",
          text: "I am sharing my live trekking safety status and progress on Sathi.",
          url: getShareUrl(),
        });
        return;
      } catch {
        // User cancelled or share failed
      }
    }
    await handleCopy();
  };

  return (
    <div
      className={`rounded-2xl border border-border bg-surface p-4 sm:p-5 space-y-3.5 ${className}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="h-9 w-9 rounded-xl bg-accent/15 border border-accent/30 flex items-center justify-center text-accent">
            <Share2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-text">
              Family Share Link
            </h4>
            <p className="text-xs text-text-muted">
              Live updates for loved ones back home
            </p>
          </div>
        </div>

        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-ok/10 text-ok border border-ok/20 font-medium">
          Privacy Protected
        </span>
      </div>

      <p className="text-xs text-text-muted">
        Family can view your current route, altitude, and check-in status. GPS coordinates are rounded to 100 meters to protect your privacy. No medical details or symptoms are exposed.
      </p>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleNativeShare}
          className="flex-1 h-10 px-4 rounded-xl bg-accent hover:bg-accent/90 text-accent-ink font-semibold text-xs flex items-center justify-center gap-2 transition-all shadow-sm cursor-pointer"
        >
          <Share2 className="h-3.5 w-3.5" />
          Share with Family
        </button>

        <button
          onClick={handleCopy}
          className="h-10 px-3.5 rounded-xl border border-border bg-surface-2/30 hover:bg-surface-2 text-text text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          title="Copy Link"
        >
          {copied ? (
            <>
              <Check className="h-3.5 w-3.5 text-ok" />
              <span className="text-[11px]">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3.5 w-3.5" />
              <span className="text-[11px]">Copy</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
