"use client";

import { Eye, FilePenLine, Layers3 } from "lucide-react";
import { useEffect, useState } from "react";

const slides = [
  {
    key: "all",
    label: "All services",
    description: "Everything you have created in one place.",
    icon: Layers3,
  },
  {
    key: "published",
    label: "Published",
    description: "Live services students can discover right now.",
    icon: Eye,
  },
  {
    key: "drafts",
    label: "Drafts",
    description: "Private ideas waiting for their finishing touches.",
    icon: FilePenLine,
  },
] as const;

export function DashboardStatCarousel({
  all,
  drafts,
  published,
}: {
  all: number;
  drafts: number;
  published: number;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const values = { all, drafts, published };
  const active = slides[activeIndex];

  useEffect(() => {
    if (paused || window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      return;
    const interval = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % slides.length);
    }, 3500);
    return () => window.clearInterval(interval);
  }, [paused]);

  const Icon = active.icon;

  return (
    <section
      aria-label="Service statistics"
      className="group relative min-h-64 overflow-hidden px-5 py-3 [perspective:900px] sm:px-6"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget))
          setPaused(false);
      }}
      onFocus={() => setPaused(true)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="dashboard-stage pointer-events-none absolute inset-0 flex items-center justify-center opacity-90 [transform-style:preserve-3d]">
        <span className="absolute size-36 translate-z-0 rounded-full bg-accent/12 blur-2xl" />
        <div className="absolute inset-0 flex items-center justify-center [transform-style:preserve-3d]">
          {["ring-1", "ring-2", "ring-3", "ring-4", "ring-5"].map(
            (ring, index) => (
              <span
                className={`dashboard-ring-3d ${ring} absolute rounded-[50%] border ${
                  index % 2 === 0 ? "border-accent/20" : "border-secondary"
                }`}
                key={ring}
                style={{ animationDelay: `${index * -620}ms` }}
              />
            ),
          )}
        </div>
      </div>

      <div
        className="dashboard-stat-content stat-enter relative flex min-h-52 flex-col items-center justify-center text-center [transform-style:preserve-3d]"
        key={active.key}
      >
        <span className="flex size-9 items-center justify-center rounded-full bg-secondary">
          <Icon aria-hidden="true" className="size-4" />
        </span>
        <p className="mt-3 font-heading text-6xl tracking-[-0.06em] text-accent">
          {values[active.key]}
        </p>
        <h2 className="mt-1 text-sm font-bold">{active.label}</h2>
        <p className="mt-1 max-w-xs text-xs leading-5 text-muted-foreground">
          {active.description}
        </p>
      </div>

      <div
        className="relative flex justify-center gap-2"
        role="group"
        aria-label="Choose statistic"
      >
        {slides.map((slide, index) => (
          <button
            aria-label={`Show ${slide.label}`}
            aria-pressed={activeIndex === index}
            className={`h-2 rounded-full transition-all ${
              activeIndex === index
                ? "w-6 bg-accent"
                : "w-2 bg-border hover:bg-muted-foreground"
            }`}
            key={slide.key}
            type="button"
            onClick={() => setActiveIndex(index)}
          />
        ))}
      </div>
    </section>
  );
}
