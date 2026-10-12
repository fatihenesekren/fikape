import { describe, expect, it } from "vitest";
import { urunKategoriEtiketi } from "./kategoriEtiketi";

describe("urunKategoriEtiketi", () => {
  it("kamyonette gövdeye özel etiket yazar: van, pickup, camlı van, minibüs", () => {
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "van")).toBe("Kamyonet / Van");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "pickup")).toBe("Kamyonet / Pickup");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "camli_van")).toBe("Kamyonet / Camlı Van");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "minibus")).toBe("Kamyonet / Minibüs");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "minivan")).toBe("Kamyonet / Minivan");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "panelvan")).toBe("Kamyonet / Panelvan");
  });

  it("gövde yok ya da bilinmiyorsa yalnız 'Kamyonet'; eski DB adı ('Kamyonet / Pickup') sızmaz", () => {
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet / Pickup", undefined)).toBe("Kamyonet");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet / Pickup", "")).toBe("Kamyonet");
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet / Pickup", "uzay-gemisi")).toBe("Kamyonet");
  });

  it("büyük/küçük harf farkı gövdeyi bozmaz", () => {
    expect(urunKategoriEtiketi("kamyonet", "Kamyonet", "VAN")).toBe("Kamyonet / Van");
  });

  it("diğer kategorilerde kategori adı aynen döner; ad yoksa 'Araç'", () => {
    expect(urunKategoriEtiketi("otomobil", "Otomobil", "suv")).toBe("Otomobil");
    expect(urunKategoriEtiketi("e-scooter", "E-Scooter", null)).toBe("E-Scooter");
    expect(urunKategoriEtiketi(null, null, null)).toBe("Araç");
  });
});
