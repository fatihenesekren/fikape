import { describe, it, expect } from "vitest";
import {
  searchHref, searchSummary, searchParcalari, kullaniciyaGoreGrupla, savedSearchBildirimMesaji,
  type SavedSearchRow,
} from "./savedSearchGoster";

const temel: SavedSearchRow = {
  id: 1, city: "İstanbul", category: null, brand: null, paymentIntent: null,
  yearMin: null, yearMax: null, kmMin: null, kmMax: null, fuelTypes: [], transmissions: [],
};

describe("searchSummary / searchParcalari", () => {
  it("yalnız il varsa tek parça", () => {
    expect(searchParcalari(temel)).toEqual(["İstanbul"]);
    expect(searchSummary(temel)).toBe("İstanbul");
  });

  it("kriterler sırayla birleşir", () => {
    const s: SavedSearchRow = {
      ...temel,
      category: { name: "Otomobil", slug: "otomobil" },
      brand: { name: "Citroen", slug: "citroen" },
      paymentIntent: "SWAP_ONLY",
    };
    expect(searchSummary(s)).toBe("İstanbul · Otomobil · Citroen · Sadece takas");
  });

  it("farklı kriterli iki arama farklı özet taşır", () => {
    const a = { ...temel, brand: { name: "Fiat", slug: "fiat" } };
    const b = { ...temel, brand: { name: "Renault", slug: "renault" } };
    expect(searchSummary(a)).not.toBe(searchSummary(b));
  });
});

describe("searchHref", () => {
  it("il her zaman, diğer kriterler doluysa eklenir", () => {
    const s: SavedSearchRow = { ...temel, category: { name: "Otomobil", slug: "otomobil" }, yearMin: 2018, kmMax: 90000, fuelTypes: ["DIESEL"] };
    const url = new URL(searchHref(s), "https://x.test");
    expect(url.pathname).toBe("/takas");
    expect(url.searchParams.get("il")).toBe("İstanbul");
    expect(url.searchParams.get("kategori")).toBe("otomobil");
    expect(url.searchParams.get("yilMin")).toBe("2018");
    expect(url.searchParams.get("kmMax")).toBe("90000");
    expect(url.searchParams.get("yakit")).toBe("DIESEL");
  });

  it("birden çok yakıt tek parametreye indirgenmez (yakit yazılmaz)", () => {
    const url = new URL(searchHref({ ...temel, fuelTypes: ["DIESEL", "GASOLINE"] }), "https://x.test");
    expect(url.searchParams.get("yakit")).toBeNull();
  });
});

describe("kullaniciyaGoreGrupla", () => {
  it("aynı kullanıcının aramaları tek grupta", () => {
    const g = kullaniciyaGoreGrupla([{ userId: 1, id: 10 }, { userId: 2, id: 11 }, { userId: 1, id: 12 }]);
    expect(g.size).toBe(2);
    expect(g.get(1)?.map((r) => r.id)).toEqual([10, 12]);
  });
});

describe("savedSearchBildirimMesaji", () => {
  it("tek aramada hangi aramaya uyduğunu söyler", () => {
    const m = savedSearchBildirimMesaji({
      aramalar: [{ ...temel, brand: { name: "Citroen", slug: "citroen" } }],
      aracAdi: "Citroen C5 Aircross", city: "İstanbul",
    });
    expect(m).toContain("İstanbul · Citroen");
    expect(m).toContain("Citroen C5 Aircross");
  });

  it("birden çok aramada sayıyı söyler", () => {
    const m = savedSearchBildirimMesaji({ aramalar: [temel, { ...temel, id: 2 }], aracAdi: "Fiat Egea", city: "Ankara" });
    expect(m).toContain("2 kayıtlı aramanıza");
    expect(m).toContain("Fiat Egea · Ankara");
  });
});
