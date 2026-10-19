import { describe, expect, it } from "vitest";

import { validateContact, validateProfile } from "./validation";

describe("profile validation", () => {
  it("trims valid profile fields", () => {
    expect(
      validateProfile("  Maya Chen  ", "  Student photographer  "),
    ).toEqual({
      data: { fullName: "Maya Chen", bio: "Student photographer" },
      error: null,
    });
  });

  it("rejects invalid profile lengths", () => {
    expect(validateProfile("M", "").error).toMatch(/between 2 and 80/i);
    expect(validateProfile("Maya", "x".repeat(501)).error).toMatch(/500/i);
  });
});

describe("contact validation", () => {
  it("normalizes email addresses", () => {
    expect(validateContact("email", " Student@Example.COM ")).toEqual({
      value: "student@example.com",
      error: null,
    });
  });

  it("validates phone numbers by their digit count", () => {
    expect(validateContact("phone", "+1 (619) 555-0123").error).toBeNull();
    expect(validateContact("phone", "123").error).toMatch(/valid phone/i);
  });

  it("normalizes Instagram handles and URLs", () => {
    expect(
      validateContact("instagram", "https://instagram.com/Maya.Demo/"),
    ).toEqual({
      value: "@maya.demo",
      error: null,
    });
  });

  it("accepts only LinkedIn profile URLs", () => {
    expect(validateContact("linkedin", "linkedin.com/in/jordan-demo")).toEqual({
      value: "https://www.linkedin.com/in/jordan-demo",
      error: null,
    });
    expect(validateContact("linkedin", "example.com/jordan").error).toMatch(
      /linkedin profile/i,
    );
  });
});
