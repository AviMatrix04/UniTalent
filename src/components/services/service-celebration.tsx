"use client";

import { ArrowRight, Check, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

const particles = Array.from({ length: 18 }, (_, index) => ({
  id: index,
  left: `${8 + ((index * 29) % 84)}%`,
  delay: `${(index % 6) * 90}ms`,
  color: index % 3 === 0 ? "bg-secondary" : "bg-accent",
}));

export function ServiceCelebration({
  kind,
  serviceId,
}: {
  kind?: "draft" | "published";
  serviceId?: string;
}) {
  const [open, setOpen] = useState(Boolean(kind));
  useEffect(() => {
    if (!open || !kind) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [kind, open]);

  if (!kind || !open) return null;
  const published = kind === "published";

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[60] flex items-center justify-center bg-foreground/55 p-5 backdrop-blur-sm"
      role="dialog"
      aria-labelledby="celebration-title"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(false);
      }}
    >
      <div className="celebration-enter relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-border bg-card p-7 text-center shadow-2xl sm:p-10">
        {particles.map((particle) => (
          <span
            aria-hidden="true"
            className={`celebration-particle absolute top-[-1rem] size-2 rounded-full ${particle.color}`}
            key={particle.id}
            style={{ left: particle.left, animationDelay: particle.delay }}
          />
        ))}
        <button
          aria-label="Close celebration"
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground"
          type="button"
          onClick={() => setOpen(false)}
        >
          <X aria-hidden="true" className="size-5" />
        </button>
        <span className="mx-auto flex size-16 items-center justify-center rounded-full bg-accent text-white shadow-lg shadow-accent/25">
          {published ? (
            <Check aria-hidden="true" className="size-8" />
          ) : (
            <Sparkles aria-hidden="true" className="size-8" />
          )}
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.2em] text-accent">
          {published ? "Now live on campus" : "A new idea begins"}
        </p>
        <h2
          className="mt-3 font-heading text-4xl tracking-[-0.04em] sm:text-5xl"
          id="celebration-title"
        >
          {published ? "Your service is live!" : "Your draft is ready!"}
        </h2>
        <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted-foreground">
          {published
            ? "Students can now discover your talent, view your work, and contact you directly."
            : "Add portfolio images, strengthen the details, and publish when it feels ready."}
        </p>
        <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
          {published && serviceId ? (
            <Link
              className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-bold text-white"
              href={`/services/${serviceId}`}
            >
              View service <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          ) : null}
          <button
            className="h-11 rounded-full border border-border px-5 text-sm font-bold hover:bg-muted"
            type="button"
            onClick={() => setOpen(false)}
          >
            {published ? "Back to dashboard" : "Continue editing"}
          </button>
        </div>
      </div>
    </div>
  );
}
