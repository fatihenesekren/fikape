import { describe, it, expect } from "vitest";
import * as icerik from "./icerik";

// Bilgi sayfasına ücret/garanti/doğrulama vaadi ya da iç terim sızmasın (kullanım koşulları madde 10:
// platform aracıdır, beyanları doğrulamaz).
function tumMetinler(): string[] {
  const out: string[] = [];
  const topla = (v: unknown) => {
    if (typeof v === "string") out.push(v);
    else if (Array.isArray(v)) v.forEach(topla);
    else if (v && typeof v === "object") Object.values(v).forEach(topla);
  };
  topla(icerik);
  return out;
}

describe("Takas bilgi sayfası metinleri", () => {
  it("metin var", () => {
    expect(tumMetinler().length).toBeGreaterThan(20);
  });

  it("yasak ifade ve iç terim içermez", () => {
    const yasak = /(ücretsiz|garanti|güvenli takas|doğrulanmış|onaylanmış|her ilan incelenir|komisyon|CURRENT|APPROVED|PUBLISHED|trustLevel)/i;
    for (const m of tumMetinler()) expect(m).not.toMatch(yasak);
  });

  it("silme süresi cron davranışıyla uyumlu (6 ay, hasar notu ve tramer kapsam dışı)", () => {
    const m = icerik.TAKAS_GORUNUR.join(" ");
    expect(m).toMatch(/6 ay/);
    expect(m).toMatch(/Hasar notları ve tramer kayıtları/);
  });

  it("SSS metinleri düz metin (JSON-LD için HTML yok)", () => {
    for (const s of icerik.TAKAS_SSS) {
      expect(s.q).not.toMatch(/[<>]/);
      expect(s.a).not.toMatch(/[<>]/);
    }
  });
});
