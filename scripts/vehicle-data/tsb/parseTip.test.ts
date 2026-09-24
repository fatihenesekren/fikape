import { describe, expect, it } from "vitest";
import { parseTip, type ParsedTip } from "./parseTip";

function ok(marka: string, tip: string): ParsedTip {
  const r = parseTip(marka, tip);
  if (!r.ok) throw new Error(`${tip} ayrıştırılamadı: ${r.neden}`);
  return r.value;
}

describe("parseTip — TSB tip adı ayrıştırma", () => {
  it("tüm alanları ayırır (Egea)", () => {
    const t = ok("TOFAS-FIAT", "EGEA SEDAN URBAN 1.6 E-TORQ 110 AT6");
    expect(t).toMatchObject({
      make: "Fiat", model: "Egea", kasa: "Sedan", motor: "1.6 E-Torq", hp: 110, paket: "Urban",
      yakit: "GASOLINE", yakitKaynak: "tsb", vites: "AUTOMATIC", vitesKaynak: "tsb", category: "otomobil",
    });
  });

  it("manuel vitesi tahmin etmez — işaret yoksa boş bırakır", () => {
    const t = ok("TOFAS-FIAT", "EGEA SEDAN URBAN 1.4 FIRE 95 E6");
    expect(t.vites).toBeNull();
    expect(t.hp).toBe(95);
  });

  it("parantezli sayı beygirdir", () => {
    // "(170)" başka bir motor/kW bilgisi yokken tek başına kalınca versiyon
    // metni boş olmasın diye jenerik "Elektrik" ile tamamlanır.
    expect(ok("BMW", "i3 (170)")).toMatchObject({ model: "i3", motor: "Elektrik", hp: 170, yakit: "EV", vites: "AUTOMATIC", vitesKaynak: "kural-ev" });
  });

  it("BMW motor kodundan seri ve yakıt çıkar", () => {
    expect(ok("BMW", "320d SEDAN 2.0 (190) M SPORT")).toMatchObject({ model: "3 Serisi", yakit: "DIESEL", kasa: "Sedan", paket: "M Sport" });
    expect(ok("BMW", "730Li 2.0 (258) PURE EXCELLENCE")).toMatchObject({ model: "7 Serisi", yakit: "GASOLINE" });
    expect(ok("BMW", "X1 SDRIVE 18i 1.5 (136) JOY")).toMatchObject({ model: "X1", cekis: "sDrive", yakit: "GASOLINE", paket: "Joy" });
  });

  it("Mercedes sınıfını seriye çevirir, işaretsiz motoru adlandırma kuralıyla etiketler", () => {
    expect(ok("MERCEDES", "E 200 d 9G-TRONIC AMG")).toMatchObject({ model: "E Serisi", yakit: "DIESEL", vites: "AUTOMATIC" });
    expect(ok("MERCEDES", "E 200 2.0 AMG 9G-TRONIC")).toMatchObject({ yakit: "GASOLINE", yakitKaynak: "kural-adlandirma" });
    expect(ok("MERCEDES", "S 300 h LONG 2.2").yakit).toBe("HYBRID");
  });

  it("alt markaları ayırır", () => {
    expect(ok("CHRYSLER", "JEEP WRANGLER RUBICON 2.8 CRD 4 KAPI")).toMatchObject({ make: "Jeep", model: "Wrangler", yakit: "DIESEL" });
    expect(ok("CHERY", "OMODA 5 COMFORT")).toMatchObject({ make: "Omoda", model: "Omoda 5" });
    expect(ok("RENAULT", "ALPINE A110 S")).toMatchObject({ make: "Alpine", model: "A110" });
  });

  it("Range Rover markasında model adı yazılmasa da modeli bulur", () => {
    expect(ok("RANGE ROVER", "3.0 D350 AUTOBIOGRAPHY")).toMatchObject({ make: "Land Rover", model: "Range Rover", yakit: "DIESEL" });
    expect(ok("RANGE ROVER", "SPORT 3.0 SDV6 HSE").model).toBe("Range Rover Sport");
  });

  it("Mini'de model kasa adıdır", () => {
    expect(ok("MINI", "MINI COOPER COUNTRYMAN ALL4 1.5 136 SIGNATURE")).toMatchObject({ model: "Countryman", cekis: "ALL4" });
    expect(ok("MINI", "MINI ONE D 1.5 95 SALT").model).toBe("Cooper");
  });

  it("'E5' model adıysa emisyon kodu diye atmaz", () => {
    expect(ok("DFSK", "E5 PHEV 1.5L AT 7 KOLTUK ELEGANCE").model).toBe("E5");
  });

  it("tek haneli versiyon adını nesil sanmaz", () => {
    const t = ok("PORSCHE", "TAYCAN 4 CROSS TURISMO FL");
    expect(t.nesil).toBeNull();
    expect(ok("FORD", "FOCUS III TREND 1.6 TDCi (95) 5K").nesil).toBe("III");
  });

  it("iki kelimelik ve yazım hatalı otomatik vites işaretlerini tanır", () => {
    expect(ok("AUDI", "A4 AVANT 1.4 TFSI 150 SPORT S TONIC").vites).toBe("AUTOMATIC");
    expect(ok("AUDI", "Q5 2.0 TDI 190 QUATTRO DESIGN S TRONIC")).toMatchObject({ vites: "AUTOMATIC", cekis: "quattro", paket: "Design" });
    expect(ok("DACIA", "SANDERO STEPWAY STYLE 1.5 DCI 90 EASY-R").vites).toBe("AUTOMATIC");
    expect(ok("TOYOTA", "COROLLA 1.4 D-4D ACTIVE M/M").vites).toBe("AUTOMATIC");
  });

  it("Audi güç kodunu motora koyar", () => {
    expect(ok("AUDI", "A6 AVANT 40 2.0TDI 204 QUATTRO DESIGN STRONIC")).toMatchObject({ motor: "40 2.0 TDI", hp: 204, paket: "Design" });
  });

  it("hafif ticariyi ayırır, ağırlık kodunu motora koyar", () => {
    expect(ok("OTOYOL\\IVECO\\FIAT", "DAILY SASI KAMYONET 35 C 15 CC 3750 E6")).toMatchObject({ category: "kamyonet", model: "Daily", motor: "35C15" });
    expect(ok("FORD", "TRANSIT MCAI 440E 19+1 ECOBLUE 165 DELUXE")).toMatchObject({ category: "kamyonet", motor: "440E EcoBlue", hp: 165 });
    expect(ok("TOFAS-FIAT", "DOBLO CLASSIC COMBI PLUS 1.9 M.JET").category).toBe("otomobil");
  });

  it("elektrikli işaretlerini tanır", () => {
    expect(ok("RENAULT", "FLUENCE ZE DYNAMIQUE").yakit).toBe("EV");
    expect(ok("TOGG", "T10X V1 RWD STANDART MENZIL 160KW")).toMatchObject({ yakit: "EV", hp: 218, cekis: "RWD" });
  });

  it("ağır vasıta ve kapsam dışı markaları dışarıda bırakır", () => {
    expect(parseTip("RENAULT", "CEKICI PREMIUM 430.19 T 4x2").ok).toBe(false);
    expect(parseTip("MOTORSIKLET", "HONDA PCX 125").ok).toBe(false);
  });

  it("Volvo motor kodlarından yakıtı bilir, B kodunda tahmin etmez", () => {
    expect(ok("VOLVO", "V60 2.0 D4 PREMIUM").yakit).toBe("DIESEL");
    expect(ok("VOLVO", "XC60 2.5 T5 AWD GEARTRONIC")).toMatchObject({ yakit: "GASOLINE", yakitKaynak: "tsb" });
    expect(ok("VOLVO", "XC60 2.0 B4 PLUS").yakit).toBeNull();
  });

  it("Lexus ayrık motor kodunu okur", () => {
    expect(ok("LEXUS", "NX 300H 4x4 LUXURY E-CVT")).toMatchObject({ model: "NX", motor: "NX300h", yakit: "HYBRID" });
  });

  it("BMW motor kodunu resmi yazımla gösterir", () => {
    expect(ok("BMW", "740Le XDRIVE iPERFORMANCE 2.0 326 PURE").motor).toBe("740Le 2.0");
  });

  it("kasa/vites/yakıt yazım hatalarını paket sanmaz", () => {
    expect(ok("BMW", "Z4 ROADSTAR SDRIVE 28i EXCLUSIVE")).toMatchObject({ kasa: "Roadster", paket: "Exclusive", yakit: "GASOLINE" });
    expect(ok("VOLVO", "XC60 2.4 D5 AWD GEARTONIC").vites).toBe("AUTOMATIC");
  });

  it("belirsiz kısaltmalardan yakıt çıkarmaz, çelişkide tahmin etmez", () => {
    // "EB": binekte EcoBoost (benzin), Transit/Tourneo Custom'da EcoBlue (dizel)
    expect(ok("FORD", "TRANSIT CUSTOM VAN 320L EB UPG 136 TREND")).toMatchObject({ yakit: null, motor: "320L EB", hp: 136 });
    // "CR" burada donanım kısaltması, common rail değil
    expect(ok("HYUNDAI", "I10 FL 1.2 MPI 84 ELITE CR AMT").yakit).toBe("GASOLINE");
    // TSI (güçlü benzin) + tek "D" (zayıf) → benzin
    expect(ok("VOLKSWAGEN", "TIGUAN ALLSPACE 1.4 TSI ACT 150 COMFORTLINE D").yakit).toBe("GASOLINE");
    // "3.5T" tonajdır; CDI (güçlü dizel) kazanır
    expect(ok("MERCEDES", "SPRINTER PANELVAN ORTA 163 3.5T 316 CDI").yakit).toBe("DIESEL");
    // "1.6i" zayıf sonek, "TDCi" motor ailesi (güçlü) → dizel
    expect(ok("FORD", "FOCUS III TITANIUM 1.6i TDCi (115) 4K").yakit).toBe("DIESEL");
    // İki işaret de zayıf ("4.5T" tonaj, "165 D") → kullanıcıya sorulur, adlandırma kuralı da uygulanmaz
    expect(ok("RENAULT", "MASTER PANELVAN L4H3 17M3 CT 4.5T 165 D-FULL")).toMatchObject({ yakit: null, yakitKaynak: null });
    // Açık "DIZEL" kelimesi çelişkiyi çözer
    expect(ok("OPEL", "CORSA 1.3 ECOTEC 95 EASYTRONIC S&S DIZEL").yakit).toBe("DIESEL");
  });

  it("yalnız kW ile anılan elektrikli motorlarda versiyon metni boş kalmaz", () => {
    // Motor hacmi/aile kelimesi yok, tek bilgi "150KW" — beygire çevrilir AMA
    // versiyon metni de boş kalmamalı (aksi halde "Versiyon belirtilmemiş · 204 HP" gibi
    // tutarsız görünür) — bkz. kullanıcı geri bildirimi.
    const t = ok("BYD", "ATTO 3 150KW");
    expect(t.motor).toBe("150 kW");
    expect(t.hp).toBe(204);
  });

  it("mantıksız beygir değerini (kaynağın kendi hatası) tahmin etmeden atar", () => {
    // Gerçek TSB satırı: "(6400)" burada beygir değil — 6.4L motoru işaret ediyor
    // gibi görünüyor ama emin olunamaz; 1500'ün üstü beygir güvenilmez sayılır.
    const t = ok("DODGE/USA", "CHALLENGER SRT8 (6400)");
    expect(t.hp).toBeNull();
    expect(t.paket).toBe("SRT8");
  });

  it("'4D' yalnız gövde önekiyken sedan sayılır, motor kodu parçası veya SUV'da değil", () => {
    // Honda'da "4D" gövde adının kendisidir — Civic/City sedan modelleri
    expect(ok("HONDA", "CIVIC 4D DREAM 1.6 125").kasa).toBe("Sedan");
    expect(ok("HONDA", "CITY 4D 1.5 ELEGANCE").kasa).toBe("Sedan");
    // SEAT Ateca bir SUV'dur; TSB metninde ortada geçen "4D" sedan anlamına gelmez
    expect(ok("SEAT", "ATECA 1.4 ECOTSI ACT 150 4D XCELLENCE").kasa).not.toBe("Sedan");
    // Toyota'da "D 4D" dizel motor kodunun (D-4D) parçasıdır, gövde bilgisi değildir
    expect(ok("TOYOTA", "PRADO 3.0 D 4D").kasa).not.toBe("Sedan");
  });

  it("kaynaktaki yazım hatasını düzeltir ve kaydeder", () => {
    const t = ok("ALFA ROMEO", "STEVIO 2.0 280 Q4");
    expect(t.model).toBe("Stelvio");
    expect(t.duzeltmeler).toContain("STEVIO→STELVIO");
  });
});
