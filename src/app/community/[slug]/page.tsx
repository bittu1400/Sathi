import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowUp, MessageSquare, Users } from "lucide-react";
import { COMMUNITIES, formatAge, getCommunity } from "@/lib/community";

export function generateStaticParams() {
  return COMMUNITIES.map((community) => ({ slug: community.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const community = getCommunity((await params).slug);
  return { title: community?.name ?? "Community" };
}

export default async function CommunityBoardPage({ params }: { params: Promise<{ slug: string }> }) {
  const community = getCommunity((await params).slug);
  if (!community) notFound();

  // Highest score first: the board reads like the place's current consensus.
  const posts = [...community.posts].sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="space-y-2">
        <Link
          href="/community"
          className="inline-flex min-h-12 items-center gap-2 text-body text-accent hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-5" aria-hidden /> All communities
        </Link>
        <h1 className="text-h1">{community.name}</h1>
        <p className="text-text-muted">{community.blurb}</p>
        <p className="inline-flex items-center gap-1.5 text-small text-text-muted">
          <Users className="size-4" aria-hidden />
          <span className="font-mono tabular-nums">{community.members.toLocaleString("en-US")}</span> members ·{" "}
          {community.place}
        </p>
      </div>

      <ul className="space-y-3">
        {posts.map((post) => (
          <li key={post.id} className="flex gap-4 rounded-[var(--radius-lg)] border border-line bg-surface p-4 md:p-5">
            <div className="flex w-10 shrink-0 flex-col items-center gap-1 text-text-muted">
              <ArrowUp className="size-5" aria-hidden />
              <span className="font-mono text-body tabular-nums text-text">{post.score}</span>
            </div>
            <div className="min-w-0 space-y-1">
              <h2 className="text-h2 text-text">{post.title}</h2>
              <p className="text-small text-text-muted">
                {post.author} · {formatAge(post.agoHours)}
              </p>
              <p className="text-body text-text-muted">{post.body}</p>
              <p className="inline-flex items-center gap-1.5 pt-1 text-small text-text-muted">
                <MessageSquare className="size-4" aria-hidden />
                <span className="font-mono tabular-nums">{post.comments}</span> comments
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
