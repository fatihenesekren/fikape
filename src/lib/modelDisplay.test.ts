import { describe, it, expect } from "vitest";
import { stripModelGenRange, stripGenRangeAnywhere, splitTrimName } from "./modelDisplay";

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
    expect(stripGenRangeAnywhere("Citroën C5 Aircross")).toBe("Citroën C5 Aircross");
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
});
