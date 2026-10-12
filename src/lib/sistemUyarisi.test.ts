import { describe, it, expect } from "vitest";
import { uyariKovasi, uyariTuru } from "./sistemUyarisi";

describe("uyariKovasi", () => {
  it("UTC saatine göre 9 karakterlik kova üretir (VarChar(10)'a sığar)", () => {
    const k = uyariKovasi(new Date("2026-10-12T14:35:00Z"));
    expect(k).toBe("261012T14");
    expect(k.length).toBeLessThanOrEqual(10);
  });
  it("aynı saat aynı kova, sonraki saat farklı kova", () => {
    expect(uyariKovasi(new Date("2026-10-12T14:01:00Z"))).toBe(uyariKovasi(new Date("2026-10-12T14:59:00Z")));
    expect(uyariKovasi(new Date("2026-10-12T14:59:00Z"))).not.toBe(uyariKovasi(new Date("2026-10-12T15:00:00Z")));
  });
});

describe("uyariTuru", () => {
  it("32 karakteri aşmaz", () => {
    expect(uyariTuru("cron:" + "x".repeat(60)).length).toBeLessThanOrEqual(32);
    expect(uyariTuru("giris-hatasi")).toBe("alert:giris-hatasi");
  });
});
