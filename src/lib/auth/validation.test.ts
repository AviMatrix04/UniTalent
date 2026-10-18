import { describe, expect, it } from "vitest";

import {
  isSdsuEmail,
  normalizeEmail,
  safeRedirectPath,
  validatePassword,
} from "./validation";

describe("authentication validation", () => {
  it("accepts only the exact SDSU email domain", () => {
    expect(isSdsuEmail("student@sdsu.edu")).toBe(true);
    expect(isSdsuEmail(" Student@SDSU.EDU ")).toBe(true);
    expect(isSdsuEmail("student@mail.sdsu.edu")).toBe(false);
    expect(isSdsuEmail("student@sdsu.edu.example.com")).toBe(false);
  });

  it("normalizes email addresses", () => {
    expect(normalizeEmail(" Student@SDSU.EDU ")).toBe("student@sdsu.edu");
  });

  it("enforces the password length boundaries", () => {
    expect(validatePassword("short")).toMatch(/at least 8/i);
    expect(validatePassword("long-enough")).toBeNull();
    expect(validatePassword("x".repeat(73))).toMatch(/72 characters/i);
  });

  it("allows only local redirect paths", () => {
    expect(safeRedirectPath("/dashboard?tab=profile")).toBe(
      "/dashboard?tab=profile",
    );
    expect(safeRedirectPath("https://example.com")).toBe("/dashboard");
    expect(safeRedirectPath("//example.com")).toBe("/dashboard");
  });
});
