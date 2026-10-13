import { describe, it, expect } from "vitest";
import {
  takasUygunlukKararVer,
  takasSonrakiAdim,
  takasEngelMesaji,
  enIlerideArac,
  panelSiradakiIs,
  type TakasAracUygunlugu,
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

describe("enIlerideArac", () => {
  const arac = (userProductId: number, durum: TakasDurum, aktifIlanId: number | null = null): TakasAracUygunlugu => ({
    userProductId,
    uygunluk: { uygun: durum === "UYGUN", durum, adimlar: [], tamamlanan: 1, toplam: 3, duzenlenecekYorumId: null },
    productSlug: `arac-${userProductId}`,
    productName: `Araç ${userProductId}`,
    aktifIlanId,
    km: null,
    categorySlug: "otomobil",
  });

  it("araç yoksa null", () => {
    expect(enIlerideArac([])).toBeNull();
  });

  it("garajda olmayan araç seçilmez", () => {
    expect(enIlerideArac([arac(1, "GARAJDA_DEGIL")])).toBeNull();
  });

  it("aktif ilanı olan araç, hazır olandan önce gelir", () => {
    expect(enIlerideArac([arac(1, "UYGUN"), arac(2, "YORUM_YOK", 55)])?.userProductId).toBe(2);
  });

  it("sıra: hazır > foto inceleniyor > foto eksik > yorum inceleniyor > yorum yok", () => {
    expect(enIlerideArac([arac(1, "YORUM_YOK"), arac(2, "FOTO_YOK"), arac(3, "YORUM_INCELEMEDE")])?.userProductId).toBe(2);
    expect(enIlerideArac([arac(1, "FOTO_YOK"), arac(2, "FOTO_INCELEMEDE")])?.userProductId).toBe(2);
    expect(enIlerideArac([arac(1, "FOTO_INCELEMEDE"), arac(2, "UYGUN")])?.userProductId).toBe(2);
  });

  it("eşitlikte ilk araç korunur", () => {
    expect(enIlerideArac([arac(7, "YORUM_YOK"), arac(8, "YORUM_YOK")])?.userProductId).toBe(7);
  });
});

describe("panelSiradakiIs", () => {
  const arac = (id: number, durum: TakasDurum, aktifIlanId: number | null = null, slug = `arac-${id}`): TakasAracUygunlugu => ({
    userProductId: id,
    uygunluk: { uygun: durum === "UYGUN", durum, adimlar: [], tamamlanan: 1, toplam: 3, duzenlenecekYorumId: 5 },
    productSlug: slug, productName: `Araç ${id}`, aktifIlanId, km: null, categorySlug: "otomobil",
  });
  const g = (araclar: TakasAracUygunlugu[], ozellikAcik = true) => panelSiradakiIs({ ozellikAcik, araclar });

  it("özellik kapalıysa null", () => {
    expect(g([arac(1, "UYGUN")], false)).toBeNull();
  });

  it("takasa hazır araç: ilanlarım'daki o araca buton", () => {
    const r = g([arac(7, "UYGUN")]);
    expect(r?.buton?.etiket).toBe("Aracınızı Takasa Açın");
    expect(r?.buton?.href).toBe("/takas-panelim/ilanlarim#arac-7");
    expect(r?.metin).toBeNull();
  });

  it("hazır araç, şartı eksik araçtan ve yayındaki ilandan önce gelir", () => {
    const r = g([arac(1, "YORUM_YOK", null), arac(2, "UYGUN", null), arac(3, "UYGUN", 99)]);
    expect(r?.buton?.href).toBe("/takas-panelim/ilanlarim#arac-2");
  });

  it("şartı eksik araç: sıradaki adımın butonu", () => {
    const r = g([arac(4, "YORUM_YOK", null, "toyota-corolla")]);
    expect(r?.buton?.etiket).toBe("Fotoğraflı yorum yazın");
    expect(r?.buton?.href).toBe("/yorum-yaz?arac=toyota-corolla&takas=1");
  });

  it("incelemedeki araç: buton yok, yalnız başka yerde olmayan inceleme bilgisi", () => {
    const r = g([arac(4, "FOTO_INCELEMEDE", null)]);
    expect(r?.buton).toBeNull();
    expect(r?.metin).toContain("inceleniyor");
  });

  it("yalnız yayındaki ilan: ne buton ne cümle (sayaçlar durumu zaten söylüyor)", () => {
    expect(g([arac(1, "UYGUN", 10)])).toEqual({ buton: null, metin: null });
    expect(g([arac(1, "UYGUN", 10), arac(2, "UYGUN", 11)])).toEqual({ buton: null, metin: null });
  });

  it("araç yoksa Takas Pazarına göz atın butonu", () => {
    const r = g([]);
    expect(r?.buton?.etiket).toBe("Takas Pazarına Göz Atın");
    expect(r?.buton?.href).toBe("/takas");
    expect(r?.buton?.altYazi).toBeNull();
  });

  it("hiçbir durumda buton hedefi bir kısayol kartının hedefiyle birebir aynı değil", () => {
    // Kısayol hedefleri (sayfadaki sabit kartlar): ilanlarım, mesajlar, aramalar, pazar (yalnız araç varken).
    const kisayollar = ["/takas-panelim/ilanlarim", "/mesajlar", "/takas-panelim/aramalar", "/takas"];
    for (const r of [g([arac(1, "UYGUN")]), g([arac(1, "YORUM_YOK")]), g([arac(1, "FOTO_INCELEMEDE")]), g([arac(1, "UYGUN", 3)])]) {
      if (r?.buton) expect(kisayollar).not.toContain(r.buton.href);
    }
    // Araçsız üyede Takas Pazarı kartı yok; buton /takas olabilir.
  });

  it("'ilanınız yayında' ya da mesaj sayısı cümlesi hiçbir durumda üretilmez; iç terim/yasak ifade yok", () => {
    const yasak = /(CURRENT|APPROVED|PUBLISHED|trustLevel|ücretsiz|garanti|ilanınız yayında|ilanınız yayında|okunmamış)/i;
    const durumlar = [[], [arac(1, "UYGUN")], [arac(1, "YORUM_YOK")], [arac(1, "FOTO_INCELEMEDE")], [arac(1, "UYGUN", 3)], [arac(1, "UYGUN", 3), arac(2, "UYGUN", 4)]];
    for (const araclar of durumlar) {
      const r = g(araclar);
      expect(`${r?.buton?.etiket ?? ""} ${r?.buton?.altYazi ?? ""} ${r?.metin ?? ""}`).not.toMatch(yasak);
    }
  });
});
