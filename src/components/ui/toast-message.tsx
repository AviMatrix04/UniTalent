"use client";

import { CheckCircle2, CircleAlert, X } from "lucide-react";
import { useEffect, useState } from "react";

export function ToastMessage({
  error,
  message,
}: {
  error?: string | null;
  message?: string | null;
}) {
  const content = error ?? message;
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (!content) return;
    const timer = window.setTimeout(() => setVisible(false), 4500);
    return () => window.clearTimeout(timer);
  }, [content]);

  if (!content || !visible) return null;
  const Icon = error ? CircleAlert : CheckCircle2;

  return (
    <div
      aria-live="polite"
      className={`toast-enter fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-2.5rem)] items-start gap-3 rounded-2xl border bg-card px-4 py-3 shadow-2xl sm:max-w-sm ${
        error ? "border-destructive/30" : "border-secondary"
      }`}
      role={error ? "alert" : "status"}
    >
      <Icon
        aria-hidden="true"
        className={`mt-0.5 size-5 shrink-0 ${error ? "text-destructive" : "text-accent"}`}
      />
      <p className="text-sm font-semibold leading-5">{content}</p>
      <button
        aria-label="Dismiss notification"
        className="ml-2 rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
        type="button"
        onClick={() => setVisible(false)}
      >
        <X aria-hidden="true" className="size-4" />
      </button>
    </div>
  );
}
