import { describe, expect, it } from "vitest";

import { getAvatarPath, MAX_AVATAR_BYTES, validateAvatarFile } from "./avatar";

describe("avatar helpers", () => {
  it("accepts supported images within the size limit", () => {
    expect(validateAvatarFile({ size: 1024, type: "image/jpeg" })).toBeNull();
    expect(
      validateAvatarFile({ size: MAX_AVATAR_BYTES, type: "image/png" }),
    ).toBeNull();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(validateAvatarFile({ size: 1024, type: "image/webp" })).toMatch(
      /JPG or PNG/,
    );
    expect(validateAvatarFile({ size: 0, type: "image/png" })).toMatch(
      /non-empty/,
    );
    expect(
      validateAvatarFile({
        size: MAX_AVATAR_BYTES + 1,
        type: "image/png",
      }),
    ).toMatch(/smaller than 5 MB/);
  });

  it("creates a user-owned path with a normalized extension", () => {
    expect(getAvatarPath("student-id", "image/jpeg")).toBe(
      "student-id/avatar.jpg",
    );
    expect(getAvatarPath("student-id", "image/png")).toBe(
      "student-id/avatar.png",
    );
  });
});
