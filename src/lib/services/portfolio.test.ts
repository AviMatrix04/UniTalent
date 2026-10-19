import { describe, expect, it } from "vitest";

import {
  contactHref,
  serviceImagePath,
  validateServiceImage,
} from "./portfolio";

describe("service portfolio helpers", () => {
  it("accepts JPG and PNG files within the size limit", () => {
    expect(validateServiceImage({ size: 1024, type: "image/jpeg" })).toBeNull();
    expect(validateServiceImage({ size: 1024, type: "image/png" })).toBeNull();
  });

  it("rejects unsupported, empty, and oversized files", () => {
    expect(validateServiceImage({ size: 100, type: "image/webp" })).toMatch(
      /JPG/,
    );
    expect(validateServiceImage({ size: 0, type: "image/png" })).toMatch(
      /non-empty/,
    );
    expect(
      validateServiceImage({ size: 5 * 1024 * 1024 + 1, type: "image/png" }),
    ).toMatch(/5 MB/);
  });

  it("builds owner and service scoped storage paths", () => {
    expect(serviceImagePath("user", "service", "image", "image/png")).toBe(
      "user/service/image.png",
    );
  });

  it("builds safe contact links", () => {
    expect(contactHref("email", "student@sdsu.edu")).toBe(
      "mailto:student@sdsu.edu",
    );
    expect(contactHref("instagram", "@unitalent")).toBe(
      "https://instagram.com/unitalent",
    );
  });
});
