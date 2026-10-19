export const contactTypes = [
  "email",
  "phone",
  "instagram",
  "linkedin",
] as const;

export type ContactType = (typeof contactTypes)[number];

type ValidationResult =
  { value: string; error: null } | { value: null; error: string };

export function isContactType(value: string): value is ContactType {
  return contactTypes.includes(value as ContactType);
}

export function validateProfile(fullNameValue: string, bioValue: string) {
  const fullName = fullNameValue.trim();
  const bio = bioValue.trim();

  if (fullName.length < 2 || fullName.length > 80) {
    return {
      data: null,
      error: "Enter a name between 2 and 80 characters.",
    };
  }

  if (bio.length > 500) {
    return { data: null, error: "Your bio must be 500 characters or fewer." };
  }

  return {
    data: { fullName, bio: bio || null },
    error: null,
  };
}

export function validateContact(
  type: ContactType,
  rawValue: string,
): ValidationResult {
  const value = rawValue.trim();

  if (!value) {
    return { value: null, error: "Enter a contact value before saving." };
  }

  if (value.length > 320) {
    return { value: null, error: "Contact details are too long." };
  }

  if (type === "email") {
    const normalized = value.toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      return { value: null, error: "Enter a valid email address." };
    }
    return { value: normalized, error: null };
  }

  if (type === "phone") {
    const normalized = value.replace(/\s+/g, " ");
    const digitCount = normalized.replace(/\D/g, "").length;
    if (
      !/^[+0-9() .-]+$/.test(normalized) ||
      digitCount < 7 ||
      digitCount > 15
    ) {
      return { value: null, error: "Enter a valid phone number." };
    }
    return { value: normalized, error: null };
  }

  if (type === "instagram") {
    const normalized = value
      .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
      .replace(/^@/, "")
      .replace(/\/$/, "")
      .toLowerCase();

    if (!/^[a-z0-9._]{1,30}$/.test(normalized)) {
      return { value: null, error: "Enter a valid Instagram handle." };
    }
    return { value: `@${normalized}`, error: null };
  }

  const candidate = /^https?:\/\//i.test(value) ? value : `https://${value}`;

  try {
    const url = new URL(candidate);
    const hostname = url.hostname.toLowerCase();
    const path = url.pathname.replace(/\/$/, "");

    if (
      !["linkedin.com", "www.linkedin.com"].includes(hostname) ||
      !/^\/in\/[A-Za-z0-9_%.-]+$/.test(path)
    ) {
      return { value: null, error: "Enter a LinkedIn profile URL." };
    }

    return {
      value: `https://www.linkedin.com${path}`,
      error: null,
    };
  } catch {
    return { value: null, error: "Enter a LinkedIn profile URL." };
  }
}
