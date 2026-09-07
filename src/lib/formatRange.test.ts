import { describe, it, expect } from "vitest";
import { formatRange } from "./formatRange";

describe("formatRange", () => {
  const identity = (n: number) => String(n);

  it("shows a full range when both sides are set", () => {
    expect(formatRange(2016, 2020, identity)).toBe("2016–2020");
  });

  it("shows 've üzeri' when only min is set", () => {
    expect(formatRange(2016, null, identity)).toBe("2016 ve üzeri");
  });

  it("shows 've altı' when only max is set", () => {
    expect(formatRange(null, 120000, identity)).toBe("120000 ve altı");
  });

  it("returns empty string when neither side is set", () => {
    expect(formatRange(null, null, identity)).toBe("");
  });
});
