import { BadgeCheck, Compass, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Dashboard" };

export default function DashboardPage() {
  return (
    <main className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
        Student access confirmed
      </p>
      <h1 className="mt-4 max-w-3xl font-heading text-5xl leading-[1.02] tracking-[-0.04em] sm:text-6xl">
        You’re inside the UNI-TALENT directory.
      </h1>
      <p className="mt-6 max-w-2xl text-base leading-7 text-muted-foreground">
        Authentication and protected routes are ready. Complete your profile and
        choose how other verified students can contact you.
      </p>
      <Link
        className="mt-8 inline-flex rounded-full bg-accent px-5 py-3 text-sm font-bold text-accent-foreground transition hover:-translate-y-0.5 hover:bg-accent/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring"
        href="/profile/settings"
      >
        Complete your profile
      </Link>

      <div className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          {
            icon: BadgeCheck,
            title: "Verified access",
            copy: "Your SDSU session controls private pages.",
          },
          {
            icon: Compass,
            title: "Explore soon",
            copy: "Student services will appear here in a later phase.",
          },
          {
            icon: Sparkles,
            title: "Offer your talent",
            copy: "Complete your profile before publishing a service.",
          },
        ].map(({ icon: Icon, title, copy }) => (
          <article
            key={title}
            className="rounded-2xl border border-border bg-card p-6"
          >
            <Icon aria-hidden="true" className="size-5 text-accent" />
            <h2 className="mt-8 font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {copy}
            </p>
          </article>
        ))}
      </div>
    </main>
  );
}
