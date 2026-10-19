"use client";

import { Archive, LoaderCircle, Send, Trash2 } from "lucide-react";
import type { ReactNode } from "react";
import { useFormStatus } from "react-dom";

import {
  archiveService,
  deleteService,
  publishService,
} from "@/app/(protected)/services/actions";

type ManageableStatus = "draft" | "published" | "archived";

function ActionButton({
  children,
  tone = "default",
}: {
  children: ReactNode;
  tone?: "default" | "danger";
}) {
  const { pending } = useFormStatus();

  return (
    <button
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-full px-4 text-sm font-bold transition disabled:opacity-60 ${
        tone === "danger"
          ? "text-destructive hover:bg-destructive/10"
          : "border border-border hover:border-foreground/30 hover:bg-muted"
      }`}
      disabled={pending}
      type="submit"
    >
      {pending ? (
        <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
      ) : null}
      {children}
    </button>
  );
}

export function ServiceActions({
  serviceId,
  status,
  title,
}: {
  serviceId: string;
  status: ManageableStatus;
  title: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-end gap-1">
      {status === "published" ? (
        <form action={archiveService}>
          <input name="serviceId" type="hidden" value={serviceId} />
          <ActionButton>
            <Archive aria-hidden="true" className="size-4" />
            Archive
          </ActionButton>
        </form>
      ) : (
        <form action={publishService}>
          <input name="serviceId" type="hidden" value={serviceId} />
          <ActionButton>
            <Send aria-hidden="true" className="size-4" />
            {status === "archived" ? "Republish" : "Publish"}
          </ActionButton>
        </form>
      )}

      <form
        action={deleteService}
        onSubmit={(event) => {
          if (
            !window.confirm(
              `Permanently delete “${title}”? This cannot be undone.`,
            )
          ) {
            event.preventDefault();
          }
        }}
      >
        <input name="serviceId" type="hidden" value={serviceId} />
        <ActionButton tone="danger">
          <Trash2 aria-hidden="true" className="size-4" />
          Delete
        </ActionButton>
      </form>
    </div>
  );
}
