import { describe, it, expect } from "vitest";
import { formatOwnershipDuration } from "./duration";

describe("formatOwnershipDuration", () => {
  it("shows months only when under a year", () => {
    expect(formatOwnershipDuration(0)).toBe("0 ay");
    expect(formatOwnershipDuration(11)).toBe("11 ay");
  });

  it("shows whole years without a month remainder", () => {
    expect(formatOwnershipDuration(12)).toBe("1 yıl");
    expect(formatOwnershipDuration(24)).toBe("2 yıl");
  });

  it("shows years and months together", () => {
    expect(formatOwnershipDuration(104)).toBe("8 yıl 8 ay");
    expect(formatOwnershipDuration(13)).toBe("1 yıl 1 ay");
  });
});
