export const SERVICE_IMAGE_BUCKET = "service-images";
export const MAX_SERVICE_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_SERVICE_IMAGES = 10;
export const SERVICE_IMAGE_TYPES = ["image/jpeg", "image/png"] as const;

type ServiceImageType = (typeof SERVICE_IMAGE_TYPES)[number];

export function validateServiceImage(file: { size: number; type: string }) {
  if (!SERVICE_IMAGE_TYPES.includes(file.type as ServiceImageType)) {
    return "Choose a JPG or PNG image.";
  }
  if (file.size === 0) return "Choose a non-empty image.";
  if (file.size > MAX_SERVICE_IMAGE_BYTES) {
    return "Choose an image smaller than 5 MB.";
  }
  return null;
}

export function serviceImagePath(
  userId: string,
  serviceId: string,
  imageId: string,
  mimeType: ServiceImageType,
) {
  const extension = mimeType === "image/png" ? "png" : "jpg";
  return `${userId}/${serviceId}/${imageId}.${extension}`;
}

export function contactHref(type: string, value: string) {
  if (type === "email") return `mailto:${value}`;
  if (type === "phone") return `tel:${value.replace(/[^+\d]/g, "")}`;
  if (type === "instagram") {
    return `https://instagram.com/${value.replace(/^@/, "")}`;
  }
  if (type === "linkedin") {
    return value.startsWith("http") ? value : `https://${value}`;
  }
  return value;
}
