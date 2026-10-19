export const SERVICE_TITLE_MIN = 5;
export const SERVICE_TITLE_MAX = 100;
export const SERVICE_DESCRIPTION_MIN = 20;
export const SERVICE_DESCRIPTION_MAX = 2000;
export const MAX_SERVICE_SKILLS = 5;

export const pricingUnits = ["hour", "project"] as const;
export type PricingUnit = (typeof pricingUnits)[number];

export type ServiceFormFields = {
  title: string;
  description: string;
  price: string;
  priceUnit: PricingUnit;
};

type ServiceValidationResult =
  | { data: ServiceFormFields & { priceCents: number }; error?: never }
  | { data?: never; error: string };

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function normalizeSkillName(value: string) {
  return normalizeText(value).toLowerCase();
}

export function validateSkillNames(values: string[]) {
  if (values.length > MAX_SERVICE_SKILLS) {
    return { error: `Choose no more than ${MAX_SERVICE_SKILLS} skills.` };
  }

  const names = values.map(normalizeText);
  if (names.some((name) => name.length < 1 || name.length > 50)) {
    return { error: "Each skill must use between 1 and 50 characters." };
  }

  const normalized = names.map(normalizeSkillName);
  if (new Set(normalized).size !== normalized.length) {
    return { error: "Choose each skill only once." };
  }

  return { names };
}

export function isPricingUnit(value: string): value is PricingUnit {
  return pricingUnits.includes(value as PricingUnit);
}

export function parseUsdToCents(value: string) {
  const normalized = value.trim();

  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;

  const [dollars, fraction = ""] = normalized.split(".");
  const cents = Number(dollars) * 100 + Number(fraction.padEnd(2, "0"));

  return Number.isSafeInteger(cents) && cents <= 2_147_483_647 ? cents : null;
}

export function centsToUsdInput(cents: number) {
  return (cents / 100).toFixed(2);
}

export function formatServicePrice(cents: number, unit: PricingUnit) {
  if (cents === 0) return "Free";

  const amount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100);

  return `${amount}/${unit === "hour" ? "hour" : "service"}`;
}

export function validateService(
  titleValue: string,
  descriptionValue: string,
  priceValue: string,
  priceUnitValue: string,
): ServiceValidationResult {
  const title = normalizeText(titleValue);
  const description = descriptionValue.trim();

  if (title.length < SERVICE_TITLE_MIN || title.length > SERVICE_TITLE_MAX) {
    return {
      error: `Use between ${SERVICE_TITLE_MIN} and ${SERVICE_TITLE_MAX} characters for the title.`,
    };
  }

  if (
    description.length < SERVICE_DESCRIPTION_MIN ||
    description.length > SERVICE_DESCRIPTION_MAX
  ) {
    return {
      error: `Use between ${SERVICE_DESCRIPTION_MIN} and ${SERVICE_DESCRIPTION_MAX} characters for the description.`,
    };
  }

  const priceCents = parseUsdToCents(priceValue);
  if (priceCents === null) {
    return { error: "Enter a valid USD price with no more than two decimals." };
  }

  if (!isPricingUnit(priceUnitValue)) {
    return { error: "Choose whether the price is per hour or per service." };
  }

  return {
    data: {
      title,
      description,
      price: priceValue.trim(),
      priceCents,
      priceUnit: priceUnitValue,
    },
  };
}
