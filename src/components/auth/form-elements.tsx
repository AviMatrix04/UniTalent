"use client";

import { LoaderCircle } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

export function SubmitButton({ children }: { children: ReactNode }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-bold text-primary-foreground transition hover:-translate-y-0.5 hover:bg-primary/90 focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:translate-y-0 disabled:opacity-60"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : null}
      {pending ? "Please wait…" : children}
    </button>
  );
}

export function FormMessage({
  error,
  message,
}: {
  error?: string;
  message?: string;
}) {
  if (!error && !message) return null;

  return (
    <div
      role={error ? "alert" : "status"}
      className={`mb-5 rounded-xl border px-4 py-3 text-sm leading-5 ${
        error
          ? "border-destructive/25 bg-destructive/5 text-destructive"
          : "border-secondary bg-secondary/60 text-foreground"
      }`}
    >
      {error ?? message}
    </div>
  );
}
