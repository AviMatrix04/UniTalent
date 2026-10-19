export const AVATAR_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

export const AVATAR_MIME_TYPES = ["image/jpeg", "image/png"] as const;

type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

export function validateAvatarFile(file: { size: number; type: string }) {
  if (!AVATAR_MIME_TYPES.includes(file.type as AvatarMimeType)) {
    return "Choose a JPG or PNG image.";
  }

  if (file.size > MAX_AVATAR_BYTES) {
    return "Choose an image smaller than 5 MB.";
  }

  if (file.size === 0) {
    return "Choose a non-empty image.";
  }

  return null;
}

export function getAvatarPath(userId: string, mimeType: AvatarMimeType) {
  const extension = mimeType === "image/png" ? "png" : "jpg";

  return `${userId}/avatar.${extension}`;
}
