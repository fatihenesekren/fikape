import { describe, it, expect } from "vitest";
import {
  takasUygunlukKararVer,
  takasSonrakiAdim,
  takasEngelMesaji,
  type TakasUygunlukGirdisi,
  type TakasDurum,
} from "./takasUygunluk";

const girdi = (g: Partial<TakasUygunlukGirdisi>): TakasUygunlukGirdisi => ({ sahiplik: "CURRENT", yorumlar: [], ...g });

describe("takasUygunlukKararVer", () => {
  it("yorum yoksa YORUM_YOK", () => {
    const u = takasUygunlukKararVer(girdi({}));
    expect(u.durum).toBe("YORUM_YOK");
    expect(u.uygun).toBe(false);
    expect(u.tamamlanan).toBe(1); // yalnız garajda
    expect(u.toplam).toBe(3);
  });

  it("yalnız reddedilmiş/silinmiş/gizli yorum varsa YORUM_YOK sayılır", () => {
    for (const durum of ["REJECTED", "DELETED", "HIDDEN"]) {
      expect(takasUygunlukKararVer(girdi({ yorumlar: [{ id: 1, durum, fotolar: ["APPROVED"] }] })).durum).toBe("YORUM_YOK");
    }
  });

  it("incelemedeki yorum YORUM_INCELEMEDE", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 1, durum: "PENDING", fotolar: ["PENDING"] }] }));
    expect(u.durum).toBe("YORUM_INCELEMEDE");
    expect(u.uygun).toBe(false);
  });

  it("yayınlanmış ama fotoğrafsız yorum FOTO_YOK", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 7, durum: "PUBLISHED", fotolar: [] }] }));
    expect(u.durum).toBe("FOTO_YOK");
    expect(u.duzenlenecekYorumId).toBe(7);
    expect(u.tamamlanan).toBe(2);
  });

  it("yayınlanmış yorumda bekleyen fotoğraf FOTO_INCELEMEDE", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 7, durum: "PUBLISHED", fotolar: ["PENDING"] }] }));
    expect(u.durum).toBe("FOTO_INCELEMEDE");
  });

  it("yayınlanmış yorumda yalnız reddedilmiş fotoğraf FOTO_REDDEDILDI", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 7, durum: "PUBLISHED", fotolar: ["REJECTED"] }] }));
    expect(u.durum).toBe("FOTO_REDDEDILDI");
  });

  it("bekleyen foto, reddedilenden önce gelir (yeniden yüklemiş olabilir)", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 7, durum: "PUBLISHED", fotolar: ["REJECTED", "PENDING"] }] }));
    expect(u.durum).toBe("FOTO_INCELEMEDE");
  });

  it("yayınlanmış yorumda onaylı fotoğraf varsa UYGUN", () => {
    const u = takasUygunlukKararVer(girdi({ yorumlar: [{ id: 7, durum: "PUBLISHED", fotolar: ["APPROVED"] }] }));
    expect(u.durum).toBe("UYGUN");
    expect(u.uygun).toBe(true);
    expect(u.tamamlanan).toBe(3);
  });

  it("onaylı fotoğraf yalnız yayınlanmış yorumda sayılır", () => {
    const u = takasUygunlukKararVer(
      girdi({
        yorumlar: [
          { id: 1, durum: "PENDING", fotolar: ["APPROVED"] },
          { id: 2, durum: "PUBLISHED", fotolar: [] },
        ],
      }),
    );
    expect(u.durum).toBe("FOTO_YOK");
  });

  it("güncelleme yorumu (ikinci yorum) onaylı fotoğraf taşıyorsa yeterli", () => {
    const u = takasUygunlukKararVer(
      girdi({
        yorumlar: [
          { id: 1, durum: "PUBLISHED", fotolar: [] },
          { id: 2, durum: "PUBLISHED", fotolar: ["APPROVED"] },
        ],
      }),
    );
    expect(u.uygun).toBe(true);
  });

  it("garajda olmayan (PAST) araç hiçbir koşulda uygun değil", () => {
    const u = takasUygunlukKararVer(girdi({ sahiplik: "PAST", yorumlar: [{ id: 1, durum: "PUBLISHED", fotolar: ["APPROVED"] }] }));
    expect(u.durum).toBe("GARAJDA_DEGIL");
    expect(u.uygun).toBe(false);
  });
});

describe("takasSonrakiAdim", () => {
  const tum: TakasDurum[] = ["UYGUN", "GARAJDA_DEGIL", "YORUM_YOK", "YORUM_INCELEMEDE", "FOTO_YOK", "FOTO_INCELEMEDE", "FOTO_REDDEDILDI"];
  const ornek = (durum: TakasDurum) =>
    takasSonrakiAdim(
      { uygun: durum === "UYGUN", durum, adimlar: [], tamamlanan: 1, toplam: 3, duzenlenecekYorumId: 9 },
      "toyota-corolla",
    );

  it("her durum için metin döner", () => {
    for (const d of tum) expect(ornek(d).metin.length).toBeGreaterThan(10);
  });

  it("buton hedefleri doğru", () => {
    expect(ornek("YORUM_YOK").buton?.href).toBe("/yorum-yaz?arac=toyota-corolla&takas=1");
    expect(ornek("FOTO_YOK").buton?.href).toBe("/yorumum/9/duzenle");
    expect(ornek("FOTO_REDDEDILDI").buton?.href).toBe("/yorumum/9/duzenle");
    expect(ornek("YORUM_INCELEMEDE").buton).toBeNull();
    expect(ornek("FOTO_INCELEMEDE").buton).toBeNull();
  });

  it("kullanıcı metinlerine iç terim ve yasak ifade sızmaz", () => {
    const yasak = /(CURRENT|APPROVED|PUBLISHED|trustLevel|onaylanmış|ücretsiz|garanti|güvenli takas|doğrulanmış)/i;
    for (const d of tum) {
      const a = ornek(d);
      expect(`${a.baslik} ${a.metin} ${a.buton?.etiket ?? ""}`).not.toMatch(yasak);
    }
    expect(takasEngelMesaji(takasUygunlukKararVer(girdi({})))).not.toMatch(yasak);
  });

  it("başlık kalan adım sayısını söyler", () => {
    expect(ornek("YORUM_YOK").baslik).toBe("Takasa 2 adım kaldı");
  });
});
