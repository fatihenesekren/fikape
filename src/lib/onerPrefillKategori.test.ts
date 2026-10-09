import { describe, expect, it } from "vitest";
import { resolveOnerPrefill } from "./onerPrefill";

describe("resolveOnerPrefill — kategori parametresi", () => {
  it("katalogda olmayan sorgu + geçerli kategori → yalnız kategori dolar", () => {
    const p = resolveOnerPrefill("?q=zzzxx&kategori=e-bisiklet");
    expect(p.categorySlug).toBe("e-bisiklet");
    expect(p.selectedMake).toBe("");
  });
  it("yalnız kategori (sorgu yok) → kategori dolar, marka boş", () => {
    const p = resolveOnerPrefill("?kategori=karavan");
    expect(p.categorySlug).toBe("karavan");
    expect(p.selectedMake).toBe("");
  });
  it("geçersiz kategori yok sayılır", () => {
    expect(resolveOnerPrefill("?q=zzzxx&kategori=hatali").categorySlug).toBe("");
    expect(resolveOnerPrefill("?kategori=__proto__").categorySlug).toBe("");
  });
  it("marka adı + kategori → marka ve kategori dolar", () => {
    const p = resolveOnerPrefill("?brandName=Opel&kategori=otomobil");
    expect(p.categorySlug).toBe("otomobil");
    expect(p.selectedMake).toBe("Opel");
  });
  it("kategori yoksa davranış eskisi gibi: tanınmayan sorguda hiçbir şey dolmaz", () => {
    const p = resolveOnerPrefill("?q=zzzxx");
    expect(p.categorySlug).toBe("");
  });
});
