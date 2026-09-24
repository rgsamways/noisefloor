import { describe, expect, it } from "vitest";
import { isValidLucideIcon } from "./icon-validation.js";

describe("isValidLucideIcon", () => {
  it("accepts a real icon name", () => {
    expect(isValidLucideIcon("radio-tower")).toBe(true);
    expect(isValidLucideIcon("wifi")).toBe(true);
  });

  it("rejects a made-up icon name", () => {
    expect(isValidLucideIcon("not-a-real-icon-xyz")).toBe(false);
  });

  it("rejects a PascalCase component name instead of the canonical kebab-case name", () => {
    expect(isValidLucideIcon("RadioTower")).toBe(false);
  });
});
