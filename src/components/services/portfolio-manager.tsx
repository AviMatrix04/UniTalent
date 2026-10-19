"use client";

import {
  ArrowDown,
  ArrowUp,
  ImagePlus,
  LoaderCircle,
  Star,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useRef, useState } from "react";

import {
  MAX_SERVICE_IMAGES,
  SERVICE_IMAGE_BUCKET,
  serviceImagePath,
  validateServiceImage,
} from "@/lib/services/portfolio";
import { createClient } from "@/lib/supabase/client";
import { ToastMessage } from "@/components/ui/toast-message";

export type PortfolioItem = {
  id: string;
  storage_path: string;
  caption: string | null;
  mime_type: string;
  size_bytes: number;
  sort_order: number;
  is_cover: boolean;
  signedUrl: string;
};

type PortfolioManagerProps = {
  initialItems: PortfolioItem[];
  serviceId: string;
  userId: string;
};

export function PortfolioManager({
  initialItems,
  serviceId,
  userId,
}: PortfolioManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [items, setItems] = useState(initialItems);
  const [working, setWorking] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function upload(files: FileList) {
    const selected = Array.from(files);
    if (items.length + selected.length > MAX_SERVICE_IMAGES) {
      setMessage(`A service can have up to ${MAX_SERVICE_IMAGES} images.`);
      return;
    }
    const invalid = selected.map(validateServiceImage).find(Boolean);
    if (invalid) {
      setMessage(invalid);
      return;
    }

    setWorking(true);
    setMessage(null);
    const supabase = createClient();
    const nextItems = [...items];

    for (const file of selected) {
      const id = crypto.randomUUID();
      const path = serviceImagePath(
        userId,
        serviceId,
        id,
        file.type as "image/jpeg" | "image/png",
      );
      const order = nextItems.length;
      const { error: uploadError } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .upload(path, file, { contentType: file.type, cacheControl: "3600" });

      if (uploadError) {
        setMessage(`Upload failed: ${uploadError.message}`);
        setWorking(false);
        return;
      }

      const { error: insertError } = await supabase
        .from("portfolio_items")
        .insert({
          id,
          service_id: serviceId,
          storage_path: path,
          caption: null,
          mime_type: file.type,
          size_bytes: file.size,
          sort_order: order,
          is_cover: order === 0,
        });

      if (insertError) {
        await supabase.storage.from(SERVICE_IMAGE_BUCKET).remove([path]);
        setMessage(`Image could not be saved: ${insertError.message}`);
        setWorking(false);
        return;
      }

      const { data } = await supabase.storage
        .from(SERVICE_IMAGE_BUCKET)
        .createSignedUrl(path, 60 * 60);
      nextItems.push({
        id,
        storage_path: path,
        caption: null,
        mime_type: file.type,
        size_bytes: file.size,
        sort_order: order,
        is_cover: order === 0,
        signedUrl: data?.signedUrl ?? URL.createObjectURL(file),
      });
    }

    setItems(nextItems);
    setMessage("Portfolio updated.");
    setWorking(false);
  }

  async function reorder(index: number, direction: -1 | 1) {
    const destination = index + direction;
    if (destination < 0 || destination >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[destination]] = [
      reordered[destination],
      reordered[index],
    ];
    const supabase = createClient();
    setWorking(true);
    const { error } = await supabase.rpc("reorder_portfolio_items", {
      target_service_id: serviceId,
      ordered_item_ids: reordered.map((item) => item.id),
    });
    if (error) setMessage(`Could not reorder images: ${error.message}`);
    else {
      setItems(reordered.map((item, sort_order) => ({ ...item, sort_order })));
      setMessage("Image order saved.");
    }
    setWorking(false);
  }

  async function makeCover(id: string) {
    const supabase = createClient();
    setWorking(true);
    const clearResult = await supabase
      .from("portfolio_items")
      .update({ is_cover: false })
      .eq("service_id", serviceId);
    const coverResult = clearResult.error
      ? clearResult
      : await supabase
          .from("portfolio_items")
          .update({ is_cover: true })
          .eq("id", id)
          .eq("service_id", serviceId);
    if (coverResult.error) {
      setMessage("The cover image could not be changed.");
    } else {
      setItems((current) =>
        current.map((item) => ({ ...item, is_cover: item.id === id })),
      );
      setMessage("Cover image saved.");
    }
    setWorking(false);
  }

  async function saveCaption(id: string, caption: string) {
    const cleaned = caption.trim().slice(0, 240);
    const supabase = createClient();
    const { error } = await supabase
      .from("portfolio_items")
      .update({ caption: cleaned || null })
      .eq("id", id)
      .eq("service_id", serviceId);
    setMessage(error ? "Caption could not be saved." : "Caption saved.");
    if (!error) {
      setItems((current) =>
        current.map((item) =>
          item.id === id ? { ...item, caption: cleaned || null } : item,
        ),
      );
    }
  }

  async function remove(item: PortfolioItem) {
    const supabase = createClient();
    setWorking(true);
    const { error } = await supabase
      .from("portfolio_items")
      .delete()
      .eq("id", item.id)
      .eq("service_id", serviceId);
    if (error) {
      setMessage("Image could not be removed.");
      setWorking(false);
      return;
    }
    await supabase.storage
      .from(SERVICE_IMAGE_BUCKET)
      .remove([item.storage_path]);
    const remaining = items.filter((current) => current.id !== item.id);
    if (remaining.length) {
      await supabase.rpc("reorder_portfolio_items", {
        target_service_id: serviceId,
        ordered_item_ids: remaining.map((current) => current.id),
      });
      if (item.is_cover) {
        await supabase
          .from("portfolio_items")
          .update({ is_cover: true })
          .eq("id", remaining[0].id);
        remaining[0] = { ...remaining[0], is_cover: true };
      }
    }
    setItems(
      remaining.map((current, sort_order) => ({ ...current, sort_order })),
    );
    setMessage("Image removed.");
    setWorking(false);
  }

  return (
    <section className="mt-10 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8 xl:col-span-2">
      <ToastMessage
        error={
          message && /failed|could not|can have|up to/i.test(message)
            ? message
            : undefined
        }
        message={
          message && !/failed|could not|can have|up to/i.test(message)
            ? message
            : undefined
        }
      />
      <div className="flex flex-wrap items-start justify-between gap-5">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-accent">
            Portfolio
          </p>
          <h2 className="mt-2 font-heading text-4xl tracking-[-0.04em]">
            Show your work.
          </h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Up to ten JPG or PNG images, 5 MB each. The cover appears first.
          </p>
        </div>
        <input
          ref={inputRef}
          accept=".jpg,.jpeg,.png,image/jpeg,image/png"
          className="sr-only"
          disabled={working || items.length >= MAX_SERVICE_IMAGES}
          multiple
          type="file"
          onChange={(event) => {
            if (event.target.files) void upload(event.target.files);
            event.target.value = "";
          }}
        />
        <button
          className="inline-flex h-11 items-center gap-2 rounded-full bg-primary px-5 text-sm font-bold text-primary-foreground disabled:opacity-50"
          disabled={working || items.length >= MAX_SERVICE_IMAGES}
          type="button"
          onClick={() => inputRef.current?.click()}
        >
          {working ? (
            <LoaderCircle className="size-4 animate-spin" />
          ) : (
            <ImagePlus className="size-4" />
          )}
          Add images
        </button>
      </div>

      {items.length ? (
        <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, index) => (
            <article
              key={item.id}
              className="overflow-hidden rounded-2xl border border-border"
            >
              <div className="relative aspect-[4/3] bg-muted">
                <Image
                  alt={item.caption || `Portfolio image ${index + 1}`}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 33vw"
                  src={item.signedUrl}
                />
                {item.is_cover ? (
                  <span className="absolute left-3 top-3 rounded-full bg-card/90 px-3 py-1 text-xs font-bold">
                    Cover
                  </span>
                ) : null}
              </div>
              <div className="space-y-3 p-4">
                <input
                  className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
                  defaultValue={item.caption ?? ""}
                  maxLength={240}
                  placeholder="Optional caption"
                  onBlur={(event) =>
                    void saveCaption(item.id, event.target.value)
                  }
                />
                <div className="flex flex-wrap gap-1">
                  <button
                    aria-label="Move image earlier"
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                    disabled={working || index === 0}
                    type="button"
                    onClick={() => void reorder(index, -1)}
                  >
                    <ArrowUp className="size-4" />
                  </button>
                  <button
                    aria-label="Move image later"
                    className="rounded-lg p-2 hover:bg-muted disabled:opacity-30"
                    disabled={working || index === items.length - 1}
                    type="button"
                    onClick={() => void reorder(index, 1)}
                  >
                    <ArrowDown className="size-4" />
                  </button>
                  <button
                    className="inline-flex items-center gap-1 rounded-lg px-2 text-xs font-bold hover:bg-muted disabled:opacity-30"
                    disabled={working || item.is_cover}
                    type="button"
                    onClick={() => void makeCover(item.id)}
                  >
                    <Star className="size-4" /> Cover
                  </button>
                  <button
                    aria-label="Delete image"
                    className="ml-auto rounded-lg p-2 text-destructive hover:bg-destructive/10 disabled:opacity-30"
                    disabled={working}
                    type="button"
                    onClick={() => void remove(item)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="mt-7 rounded-2xl border border-dashed border-border px-6 py-12 text-center text-sm text-muted-foreground">
          No portfolio images yet.
        </div>
      )}
    </section>
  );
}
