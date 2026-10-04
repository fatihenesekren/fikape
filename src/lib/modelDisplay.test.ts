import { describe, it, expect } from "vitest";
import { stripModelGenRange, stripGenRangeAnywhere, splitTrimName, gorunenTrimName, baseNameplate } from "./modelDisplay";

describe("stripModelGenRange", () => {
  it("sondaki kapalı nesil aralığını temizler", () => {
    expect(stripModelGenRange("Golf 6 (2008-2012)")).toBe("Golf 6");
  });

  it("sondaki en dash'li aralığı da temizler", () => {
    expect(stripModelGenRange("Golf 6 (2008–2012)")).toBe("Golf 6");
  });

  it("açık uçlu aralığı temizler", () => {
    expect(stripModelGenRange("Model 3 (2020-)")).toBe("Model 3");
  });

  it("nesil aralığı yoksa değiştirmez", () => {
    expect(stripModelGenRange("Golf 6")).toBe("Golf 6");
  });

  it("ortadaki parantezi kaldırmaz (sadece sonda çalışır)", () => {
    expect(stripModelGenRange("Golf 6 (2008-2012) 1.4 TSI")).toBe("Golf 6 (2008-2012) 1.4 TSI");
  });
});

describe("stripGenRangeAnywhere", () => {
  it("ortadaki nesil aralığını da temizler", () => {
    expect(stripGenRangeAnywhere("Volkswagen Golf 6 (2008-2012) 1.4 TSI 2011")).toBe(
      "Volkswagen Golf 6 1.4 TSI 2011"
    );
  });

  it("sondaki aralığı temizler", () => {
    expect(stripGenRangeAnywhere("Golf 6 (2008-2012)")).toBe("Golf 6");
  });

  it("nesil aralığı yoksa değiştirmez", () => {
    expect(stripGenRangeAnywhere("Citroen C5 Aircross")).toBe("Citroen C5 Aircross");
  });
});

describe("baseNameplate", () => {
  it("nesil aralığı + sondaki nesil numarasını atar (klasik nameplate'ler)", () => {
    expect(baseNameplate("Clio 4 (2012-2019)")).toBe("Clio");
    expect(baseNameplate("Megane 3 (2008-2016)")).toBe("Megane");
    expect(baseNameplate("Golf 7 (2012-2020)")).toBe("Golf");
    expect(baseNameplate("Clio 5 (2019-)")).toBe("Clio");
  });

  // Bilinen sınırlılık: "Ioniq 5" gibi sayının adın PARÇASI olduğu modellerde de
  // sayı atılır ("Ioniq"). findExistingVehicles bunu sadece EK bir aday slug
  // olarak kullandığı ve yalnızca numarasız/bare bir kayda denk geldiği için
  // pratik risk düşük (kardeş nesiller kendi numarasını slug'da taşır).
  it("sayı adın parçası olsa bile ≥3 harfli stem'de atar (kabul edilen tradeoff)", () => {
    expect(baseNameplate("Ioniq 5")).toBe("Ioniq");
    expect(baseNameplate("Polestar 2 (2020-)")).toBe("Polestar");
  });

  it("stem 3 harften kısaysa veya boşluk yoksa korur", () => {
    expect(baseNameplate("DS 3 (2010-2019)")).toBe("DS 3");
    expect(baseNameplate("AR 06")).toBe("AR 06");
    expect(baseNameplate("R 12")).toBe("R 12");
    expect(baseNameplate("208 (2019-)")).toBe("208");
  });

  it("nesil işareti yoksa sadece aralığı temizler", () => {
    expect(baseNameplate("Model Y")).toBe("Model Y");
    expect(baseNameplate("T10X")).toBe("T10X");
    expect(baseNameplate("Duster (2018-)")).toBe("Duster");
  });
});

describe("splitTrimName", () => {
  it("en dash ile versiyon/donanımı ayırır", () => {
    expect(splitTrimName("E 220d – Exclusive")).toEqual({ version: "E 220d", donanim: "Exclusive" });
  });

  it("normal tire ile de ayırır", () => {
    expect(splitTrimName("1.0 TSI - Comfortline")).toEqual({ version: "1.0 TSI", donanim: "Comfortline" });
  });

  it("em dash ile de ayırır", () => {
    expect(splitTrimName("2.0 TDI — Style")).toEqual({ version: "2.0 TDI", donanim: "Style" });
  });

  it("tire yoksa null döner (ör. karavan/kamyonet tek parça trim)", () => {
    expect(splitTrimName("Raptor")).toBeNull();
    expect(splitTrimName("Athlete")).toBeNull();
  });

  it("null/undefined için null döner", () => {
    expect(splitTrimName(null)).toBeNull();
    expect(splitTrimName(undefined)).toBeNull();
  });

  it("baştaki/sondaki boşlukları temizler", () => {
    expect(splitTrimName("  Long Range RWD  –  Advance  ")).toEqual({ version: "Long Range RWD", donanim: "Advance" });
  });

  it("versiyon yarısı motor-spec gürültüsüyse bölmez (null)", () => {
    expect(splitTrimName("125cc 12.5 CV – Standart")).toBeNull();
    expect(splitTrimName("250cc 23 CV – Standart")).toBeNull();
    expect(splitTrimName("90 HP – Comfort")).toBeNull();
  });
});

describe("splitTrimName — motor ölçüsüyle başlayan versiyon + model adı", () => {
  it("model adı verilirse motor ölçüsüyle başlayan versiyonun önüne eklenir", () => {
    expect(splitTrimName("2.0 TDI – Style", "Amarok")).toEqual({ version: "Amarok 2.0 TDI", donanim: "Style" });
    expect(splitTrimName("2.2 150 Dizel – Ultimate XL", "Vivaro")).toEqual({ version: "Vivaro 2.2 150 Dizel", donanim: "Ultimate XL" });
    expect(splitTrimName("1.3 Hybrid – Techno Mild", "Captur (2019-)")).toEqual({ version: "Captur 1.3 Hybrid", donanim: "Techno Mild" });
  });

  it("modele özgü kodlar (E 220d, GLC 180) olduğu gibi kalır", () => {
    expect(splitTrimName("E 220d – Exclusive", "E Serisi W213")).toEqual({ version: "E 220d", donanim: "Exclusive" });
    expect(splitTrimName("GLC 180 1.5 – AMG", "GLC")).toEqual({ version: "GLC 180 1.5", donanim: "AMG" });
  });

  it("model adı verilmezse eski davranış", () => {
    expect(splitTrimName("2.0 TDI – Style")).toEqual({ version: "2.0 TDI", donanim: "Style" });
  });
});

describe("gorunenTrimName", () => {
  it("teknik özellik dizgesini gizler (e-bisiklet/e-scooter)", () => {
    expect(gorunenTrimName("250W 25 km/h 487Wh")).toBeNull();
    expect(gorunenTrimName("1100W tepe 468Wh 25km/h")).toBeNull();
    expect(gorunenTrimName("2000W 25 km/s")).toBeNull();
    expect(gorunenTrimName("8300W Çift 72Ah")).toBeNull();
  });

  it("gerçek donanım/varyant adlarını korur", () => {
    expect(gorunenTrimName("Raptor")).toBe("Raptor");
    expect(gorunenTrimName("19 ft")).toBe("19 ft");
    expect(gorunenTrimName("390 QD")).toBe("390 QD");
    expect(gorunenTrimName("G30P")).toBe("G30P");
    expect(gorunenTrimName(null)).toBeNull();
  });
});
