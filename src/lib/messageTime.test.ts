import { describe, it, expect } from "vitest";
import { sameDay, hhmm, dayLabel, listTimeLabel } from "./messageTime";

describe("sameDay", () => {
  it("aynı gün → true", () => {
    expect(sameDay(new Date("2026-09-09T01:00:00"), new Date("2026-09-09T23:59:00"))).toBe(true);
  });
  it("farklı gün → false", () => {
    expect(sameDay(new Date("2026-09-09T23:00:00"), new Date("2026-09-10T00:30:00"))).toBe(false);
  });
});

describe("hhmm", () => {
  it("saat:dakika biçimi", () => {
    expect(hhmm(new Date("2026-09-09T14:32:00"))).toBe("14:32");
    expect(hhmm(new Date("2026-09-09T09:05:00"))).toBe("09:05");
  });
});

describe("dayLabel", () => {
  const now = new Date("2026-09-09T12:00:00");
  it("bugün", () => {
    expect(dayLabel(new Date("2026-09-09T08:00:00"), now)).toBe("Bugün");
  });
  it("dün", () => {
    expect(dayLabel(new Date("2026-09-08T20:00:00"), now)).toBe("Dün");
  });
  it("aynı yıl → gün + ay", () => {
    expect(dayLabel(new Date("2026-07-12T10:00:00"), now)).toBe("12 Temmuz");
  });
  it("farklı yıl → gün + ay + yıl", () => {
    expect(dayLabel(new Date("2025-07-12T10:00:00"), now)).toBe("12 Temmuz 2025");
  });
});

describe("listTimeLabel", () => {
  const now = new Date("2026-09-09T12:00:00");
  it("bugün → saat", () => {
    expect(listTimeLabel(new Date("2026-09-09T14:32:00"), now)).toBe("14:32");
  });
  it("dün", () => {
    expect(listTimeLabel(new Date("2026-09-08T20:00:00"), now)).toBe("Dün");
  });
  it("aynı yıl → gün + kısa ay", () => {
    expect(listTimeLabel(new Date("2026-09-04T10:00:00"), now)).toBe("4 Eyl");
  });
  it("farklı yıl → gün + kısa ay + yıl", () => {
    expect(listTimeLabel(new Date("2025-09-04T10:00:00"), now)).toBe("4 Eyl 2025");
  });
});
