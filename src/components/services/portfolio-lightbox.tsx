"use client";

import { ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

export type LightboxImage = {
  id: string;
  signedUrl: string;
  caption: string | null;
};

export function PortfolioLightbox({
  images,
  serviceTitle,
}: {
  images: LightboxImage[];
  serviceTitle: string;
}) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const active = activeIndex === null ? null : images[activeIndex];

  const move = useCallback(
    (direction: -1 | 1) => {
      setActiveIndex((current) => {
        if (current === null) return null;
        return (current + direction + images.length) % images.length;
      });
    },
    [images.length],
  );

  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActiveIndex(null);
      if (event.key === "ArrowLeft") move(-1);
      if (event.key === "ArrowRight") move(1);
    }
    window.addEventListener("keydown", handleKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", handleKey);
    };
  }, [active, move]);

  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        {images.map((image, index) => (
          <figure
            key={image.id}
            className={`group overflow-hidden rounded-3xl bg-muted ${index === 0 ? "sm:col-span-2" : ""}`}
          >
            <button
              aria-label={`Open ${serviceTitle} portfolio image ${index + 1}`}
              className={`relative block w-full overflow-hidden ${index === 0 ? "aspect-[16/9]" : "aspect-[4/3]"}`}
              type="button"
              onClick={() => setActiveIndex(index)}
            >
              <Image
                alt={
                  image.caption ||
                  `${serviceTitle} portfolio image ${index + 1}`
                }
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
                fill
                priority={index === 0}
                sizes={
                  index === 0 ? "(max-width: 1024px) 100vw, 760px" : "380px"
                }
                src={image.signedUrl}
              />
              <span className="absolute bottom-4 right-4 flex size-10 items-center justify-center rounded-full bg-card/90 text-foreground opacity-0 shadow-lg backdrop-blur transition group-hover:opacity-100 group-focus-within:opacity-100">
                <Expand aria-hidden="true" className="size-4" />
              </span>
            </button>
            {image.caption ? (
              <figcaption className="px-4 py-3 text-sm text-muted-foreground">
                {image.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {active ? (
        <div
          aria-label={`${serviceTitle} portfolio gallery`}
          aria-modal="true"
          className="fixed inset-0 z-[70] flex flex-col bg-foreground/95 p-4 text-background backdrop-blur-md sm:p-7"
          role="dialog"
          onClick={(event) => {
            if (event.currentTarget === event.target) setActiveIndex(null);
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold">
              {(activeIndex ?? 0) + 1} / {images.length}
            </p>
            <button
              aria-label="Close gallery"
              className="rounded-full border border-background/20 p-2 hover:bg-background/10"
              type="button"
              onClick={() => setActiveIndex(null)}
            >
              <X aria-hidden="true" className="size-5" />
            </button>
          </div>
          <div className="relative my-5 min-h-0 flex-1">
            <Image
              alt={active.caption || `${serviceTitle} portfolio image`}
              className="object-contain"
              fill
              priority
              sizes="100vw"
              src={active.signedUrl}
            />
          </div>
          <div className="flex items-center justify-between gap-4">
            <button
              aria-label="Previous image"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-background/20 hover:bg-background/10 disabled:opacity-40"
              disabled={images.length < 2}
              type="button"
              onClick={() => move(-1)}
            >
              <ChevronLeft aria-hidden="true" className="size-5" />
            </button>
            <p className="max-w-2xl text-center text-sm text-background/75">
              {active.caption}
            </p>
            <button
              aria-label="Next image"
              className="flex size-11 shrink-0 items-center justify-center rounded-full border border-background/20 hover:bg-background/10 disabled:opacity-40"
              disabled={images.length < 2}
              type="button"
              onClick={() => move(1)}
            >
              <ChevronRight aria-hidden="true" className="size-5" />
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
