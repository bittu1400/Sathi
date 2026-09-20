import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, MessagesSquare, Users } from "lucide-react";
import { COMMUNITIES } from "@/lib/community";

export const metadata: Metadata = { title: "Community" };

export default function CommunityPage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-1">
        <h1 className="text-h1">Community</h1>
        <p className="text-text-muted">
          Trekkers talking about the places they just walked through. Pick a board to read it.
        </p>
      </div>

      <ul className="space-y-3">
        {COMMUNITIES.map((community) => (
          <li key={community.slug}>
            <Link
              href={`/community/${community.slug}`}
              className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-line bg-surface p-4 hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent md:p-5"
            >
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block text-h2 text-text">{community.name}</span>
                <span className="block text-small text-text-muted">{community.place}</span>
                <span className="block text-body text-text-muted">{community.blurb}</span>
                <span className="flex items-center gap-4 pt-1 text-small text-text-muted">
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="size-4" aria-hidden />
                    <span className="font-mono tabular-nums">{community.members.toLocaleString("en-US")}</span> members
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <MessagesSquare className="size-4" aria-hidden />
                    <span className="font-mono tabular-nums">{community.posts.length}</span> posts
                  </span>
                </span>
              </span>
              <ChevronRight className="size-5 shrink-0 text-text-muted" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
