import { describe, expect, it } from "vitest";

import {
  centsToUsdInput,
  formatServicePrice,
  normalizeSkillName,
  parseUsdToCents,
  validateSkillNames,
  validateService,
} from "./validation";

describe("service validation", () => {
  it("converts USD input to whole cents", () => {
    expect(parseUsdToCents("0")).toBe(0);
    expect(parseUsdToCents("25")).toBe(2500);
    expect(parseUsdToCents("25.5")).toBe(2550);
    expect(parseUsdToCents("25.50")).toBe(2550);
    expect(centsToUsdInput(2550)).toBe("25.50");
  });

  it("rejects malformed prices", () => {
    expect(parseUsdToCents("-1")).toBeNull();
    expect(parseUsdToCents("1.999")).toBeNull();
    expect(parseUsdToCents("free")).toBeNull();
    expect(parseUsdToCents("")).toBeNull();
  });

  it("validates and normalizes a service draft", () => {
    expect(
      validateService(
        "  Portrait   photography  ",
        "I create relaxed campus portraits for students.",
        "40",
        "hour",
      ),
    ).toEqual({
      data: {
        title: "Portrait photography",
        description: "I create relaxed campus portraits for students.",
        price: "40",
        priceCents: 4000,
        priceUnit: "hour",
      },
    });
  });

  it("accepts free services without acknowledgement", () => {
    const result = validateService(
      "Free peer tutoring",
      "I offer a free introductory tutoring session.",
      "0",
      "hour",
    );

    expect(result.data?.priceCents).toBe(0);
  });

  it("rejects a pricing unit outside the supported options", () => {
    expect(
      validateService(
        "Portrait photography",
        "I create relaxed campus portraits for students.",
        "40",
        "day",
      ).error,
    ).toMatch(/per hour or per service/);
  });

  it("formats service prices for display", () => {
    expect(formatServicePrice(0, "project")).toBe("Free");
    expect(formatServicePrice(2500, "hour")).toBe("$25/hour");
    expect(formatServicePrice(2550, "project")).toBe("$25.50/service");
  });

  it("normalizes and validates up to five unique skills", () => {
    expect(normalizeSkillName("  Graphic   Design ")).toBe("graphic design");
    expect(validateSkillNames(["Photography", " Graphic   Design "])).toEqual({
      names: ["Photography", "Graphic Design"],
    });
    expect(
      validateSkillNames(["One", "Two", "Three", "Four", "Five", "Six"]).error,
    ).toMatch(/no more than 5/);
    expect(validateSkillNames(["Design", " design "]).error).toMatch(
      /only once/,
    );
  });
});
