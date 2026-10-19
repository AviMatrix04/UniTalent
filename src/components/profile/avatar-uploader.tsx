"use client";

import { Camera, LoaderCircle, Trash2 } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import {
  AVATAR_BUCKET,
  getAvatarPath,
  validateAvatarFile,
} from "@/lib/profile/avatar";
import { createClient } from "@/lib/supabase/client";

type AvatarUploaderProps = {
  initialPath: string | null;
  initialUrl: string | null;
  initials: string;
  userId: string;
};

export function AvatarUploader({
  initialPath,
  initialUrl,
  initials,
  userId,
}: AvatarUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [avatarPath, setAvatarPath] = useState(initialPath);
  const [avatarUrl, setAvatarUrl] = useState(initialUrl);
  const [message, setMessage] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  async function uploadAvatar(file: File) {
    const validationError = validateAvatarFile(file);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    setIsWorking(true);
    setMessage(null);

    const supabase = createClient();
    const nextPath = getAvatarPath(
      userId,
      file.type as "image/jpeg" | "image/png",
    );
    const previewUrl = URL.createObjectURL(file);
    const previousPath = avatarPath;
    const previousUrl = avatarUrl;

    setAvatarUrl(previewUrl);

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(nextPath, file, {
        cacheControl: "3600",
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      URL.revokeObjectURL(previewUrl);
      setAvatarUrl(previousUrl);
      setMessage(`Upload failed: ${uploadError.message}`);
      setIsWorking(false);
      return;
    }

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_path: nextPath })
      .eq("id", userId);

    if (profileError) {
      if (nextPath !== previousPath) {
        await supabase.storage.from(AVATAR_BUCKET).remove([nextPath]);
      }
      URL.revokeObjectURL(previewUrl);
      setAvatarUrl(previousUrl);
      setMessage(`Profile update failed: ${profileError.message}`);
      setIsWorking(false);
      return;
    }

    if (previousPath && previousPath !== nextPath) {
      await supabase.storage.from(AVATAR_BUCKET).remove([previousPath]);
    }

    const { data: signedData } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(nextPath, 60 * 60);

    URL.revokeObjectURL(previewUrl);
    setAvatarPath(nextPath);
    setAvatarUrl(signedData?.signedUrl ?? null);
    setMessage("Profile photo saved.");
    setIsWorking(false);
    router.refresh();
  }

  async function removeAvatar() {
    if (!avatarPath) return;

    setIsWorking(true);
    setMessage(null);

    const supabase = createClient();
    const { error: profileError } = await supabase
      .from("profiles")
      .update({ avatar_path: null })
      .eq("id", userId);

    if (profileError) {
      setMessage(`Removal failed: ${profileError.message}`);
      setIsWorking(false);
      return;
    }

    const { error: storageError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .remove([avatarPath]);

    setAvatarPath(null);
    setAvatarUrl(null);
    setMessage(
      storageError
        ? "Photo removed from your profile, but its stored file could not be deleted."
        : "Profile photo removed.",
    );
    setIsWorking(false);
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary font-heading text-xl">
          {avatarUrl ? (
            <Image
              alt="Your profile photo"
              className="object-cover"
              fill
              sizes="80px"
              src={avatarUrl}
            />
          ) : (
            initials
          )}
          {isWorking ? (
            <span className="absolute inset-0 flex items-center justify-center bg-primary/60 text-primary-foreground">
              <LoaderCircle
                aria-label="Updating photo"
                className="size-5 animate-spin"
              />
            </span>
          ) : null}
        </div>

        <div className="min-w-0">
          <input
            ref={inputRef}
            accept=".jpg,.jpeg,.png,image/jpeg,image/png"
            className="sr-only"
            disabled={isWorking}
            type="file"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void uploadAvatar(file);
              event.target.value = "";
            }}
          />
          <button
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60"
            disabled={isWorking}
            type="button"
            onClick={() => inputRef.current?.click()}
          >
            <Camera aria-hidden="true" className="size-4" />
            {avatarPath ? "Replace" : "Add photo"}
          </button>
          {avatarPath ? (
            <button
              className="ml-2 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-destructive transition hover:bg-destructive/10 disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isWorking}
              type="button"
              onClick={() => void removeAvatar()}
            >
              <Trash2 aria-hidden="true" className="size-4" />
              Remove
            </button>
          ) : null}
        </div>
      </div>

      <p className="mt-3 text-xs leading-5 text-muted-foreground">
        JPG or PNG, up to 5 MB.
      </p>
      <p aria-live="polite" className="mt-2 text-xs leading-5">
        {message}
      </p>
    </div>
  );
}
