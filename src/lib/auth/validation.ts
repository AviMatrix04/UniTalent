const SDSU_EMAIL_PATTERN = /^[^\s@]+@sdsu\.edu$/i;

export function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

export function isSdsuEmail(value: string) {
  return SDSU_EMAIL_PATTERN.test(normalizeEmail(value));
}

export function validatePassword(value: string) {
  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (value.length > 72) {
    return "Password must be 72 characters or fewer.";
  }

  return null;
}

export function safeRedirectPath(
  value: string | null | undefined,
  fallback = "/dashboard",
) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return fallback;
  }

  return value;
}
