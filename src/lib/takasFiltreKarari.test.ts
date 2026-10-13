import { describe, it, expect } from "vitest";
import { takasFiltreVarMi, takasIndekslenebilirMi, panelGorunumu, bosDurumMetni } from "./takasFiltreKarari";

describe("takasFiltreVarMi / takasIndekslenebilirMi", () => {
  it("boş adres filtresiz ve indekslenebilir", () => {
    expect(takasFiltreVarMi({})).toBe(false);
    expect(takasIndekslenebilirMi({})).toBe(true);
  });

  it("izleme parametreleri ve eski aramalar parametresi filtre sayılmaz", () => {
    expect(takasIndekslenebilirMi({ utm_source: "x", aramalar: "1", fbclid: "y" })).toBe(true);
  });

  it("yalnız boşluktan oluşan q filtre değildir", () => {
    expect(takasFiltreVarMi({ q: "  " })).toBe(false);
    expect(takasFiltreVarMi({ q: "egea" })).toBe(true);
  });

  it("gerçek filtre ya da 2. sayfa dizine girmez; sayfa=1 ve bozuk sayfa girer", () => {
    expect(takasIndekslenebilirMi({ il: "Bursa" })).toBe(false);
    expect(takasIndekslenebilirMi({ sayfa: "2" })).toBe(false);
    expect(takasIndekslenebilirMi({ sayfa: "1" })).toBe(true);
    expect(takasIndekslenebilirMi({ sayfa: "abc" })).toBe(true);
  });

  it("dizi değer ilk öğeyle okunur", () => {
    expect(takasFiltreVarMi({ il: ["Bursa", "Ankara"] })).toBe(true);
    expect(takasFiltreVarMi({ il: [] })).toBe(false);
  });
});

describe("panelGorunumu", () => {
  const g = (ek: Partial<Parameters<typeof panelGorunumu>[0]> = {}) =>
    panelGorunumu({ isLoggedIn: true, kaydedilebilirFiltre: false, q: "", kayitliSayisi: 0, ...ek });

  it("filtre yok: kayıt yoksa ya da giriş yoksa kart yok", () => {
    expect(g()).toBe("yok");
    expect(g({ isLoggedIn: false, kayitliSayisi: 3 })).toBe("yok");
  });

  it("filtre yok, kayıt var: yalnız liste", () => {
    expect(g({ kayitliSayisi: 2 })).toBe("yalnizListe");
  });

  it("yalnız hızlı arama kelimesi: kart (çip + temizle) görünür", () => {
    expect(g({ q: "egea" })).toBe("kart");
    expect(g({ isLoggedIn: false, q: "egea" })).toBe("kart");
  });

  it("kaydedilebilir filtre: kart", () => {
    expect(g({ kaydedilebilirFiltre: true })).toBe("kart");
  });
});

describe("bosDurumMetni", () => {
  const b = (ek: Partial<Parameters<typeof bosDurumMetni>[0]> = {}) =>
    bosDurumMetni({ il: "Bursa", isLoggedIn: true, kaydedilebilirFiltre: true, zatenKayitli: false, ...ek });

  it("il adı başlıkta, ipucu sabit", () => {
    expect(b().baslik).toBe("Bursa ilinde bu filtrelere uyan ilan yok.");
    expect(b({ il: "" }).baslik).toBe("Bu filtrelere uyan ilan yok.");
  });

  it("kayıt cümlesi duruma göre doğru: kayıtlıyken 'kaydedin' denmez", () => {
    expect(b({ zatenKayitli: true }).kayitCumlesi).toContain("kayıtlı");
    expect(b({ zatenKayitli: true }).kayitCumlesi).not.toContain("Yukarıdan");
    expect(b().kayitCumlesi).toContain("Yukarıdan");
    expect(b({ isLoggedIn: false }).kayitCumlesi).toContain("Giriş yaparak");
  });

  it("kaydedilebilir filtre yoksa (yalnız kelime) kayıt cümlesi yok", () => {
    expect(b({ kaydedilebilirFiltre: false }).kayitCumlesi).toBeNull();
  });

  it("yasak ifade yok", () => {
    const m = b();
    expect(`${m.baslik} ${m.ipucu} ${m.kayitCumlesi}`).not.toMatch(/ücretsiz|garanti|doğrulanmış|onaylanmış/i);
  });
});
