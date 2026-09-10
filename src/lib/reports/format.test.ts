import { describe, it, expect } from "vitest";
import { fmtInt, fmtPct, delta, pointDelta, isoWeekString, isoWeekWindow, weekRangeLabel } from "./format";

describe("fmtInt / fmtPct", () => {
  it("binlik ayracı nokta (tr-TR)", () => {
    expect(fmtInt(18430)).toBe("18.430");
    expect(fmtInt(5)).toBe("5");
  });
  it("yüzde işareti önde", () => {
    expect(fmtPct(0.081)).toBe("%8,1");
    expect(fmtPct(0.5)).toBe("%50");
  });
});

describe("delta", () => {
  it("artışta yön ▲, iyi yönde renk up", () => {
    const d = delta(42, 35, "up");
    expect(d.arrow).toBe("▲");
    expect(d.color).toBe("up");
    expect(d.text).toContain("+20%");
    expect(d.text).toContain("(+7)");
  });
  it("azalışta 'kötü' yön için renk down", () => {
    expect(delta(3, 8, "up").color).toBe("down");
  });
  it("backlog metriği: azalış İYİ → renk up", () => {
    expect(delta(7, 9, "down").color).toBe("up");
  });
  it("prev 0 & value > 0 → 'yeni'", () => {
    expect(delta(4, 0).text).toBe("yeni");
  });
  it("prev 0 & value 0 → '— 0'", () => {
    expect(delta(0, 0).text).toBe("— 0");
  });
  it("goodDir none → renk flat", () => {
    expect(delta(10, 2, "none").color).toBe("flat");
  });
});

describe("pointDelta", () => {
  it("oran farkını puan olarak verir", () => {
    expect(pointDelta(0.71, 0.69).text).toContain("puan");
    expect(pointDelta(0.71, 0.69).text).toContain("+2");
  });
});

describe("isoWeekString", () => {
  it("ISO hafta numarası", () => {
    expect(isoWeekString(new Date("2026-01-01T00:00:00Z"))).toBe("2026-W01");
    expect(isoWeekString(new Date("2026-09-09T12:00:00Z"))).toBe("2026-W37");
  });
});

describe("isoWeekWindow", () => {
  it("Pazartesi ateşlenince 'bu hafta' = az önce biten 7 gün", () => {
    // 2026-09-14 Pazartesi
    const w = isoWeekWindow(new Date("2026-09-14T05:00:00Z"));
    expect(w.weekStart.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(w.weekEnd.toISOString()).toBe("2026-09-14T00:00:00.000Z");
    expect(w.prevStart.toISOString()).toBe("2026-08-31T00:00:00.000Z");
    expect(w.prevEnd.toISOString()).toBe("2026-09-07T00:00:00.000Z");
    expect(w.isoWeek).toBe("2026-W37");
  });
  it("yarı-açık pencere: weekEnd hariç", () => {
    const w = isoWeekWindow(new Date("2026-09-14T05:00:00Z"));
    expect(w.weekEnd.getTime()).toBe(w.prevEnd.getTime() + 7 * 86400000);
    expect(w.weekStart.getTime()).toBe(w.prevEnd.getTime());
  });
});

describe("weekRangeLabel", () => {
  it("aynı ay", () => {
    expect(weekRangeLabel(new Date("2026-09-07T00:00:00Z"), new Date("2026-09-14T00:00:00Z")))
      .toBe("7–13 Eylül 2026");
  });
  it("ay geçişi", () => {
    expect(weekRangeLabel(new Date("2026-09-28T00:00:00Z"), new Date("2026-10-05T00:00:00Z")))
      .toBe("28 Eyl – 4 Eki 2026");
  });
});
