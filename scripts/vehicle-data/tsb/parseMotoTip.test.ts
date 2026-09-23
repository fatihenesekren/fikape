import { describe, expect, it } from "vitest";
import { parseMotoTip } from "./parseMotoTip";

function ok(tip: string) {
  const r = parseMotoTip(tip);
  if (!r.ok) throw new Error(`${tip} ayrıştırılamadı: ${r.neden}`);
  return r.value;
}

describe("parseMotoTip", () => {
  it("marka + modeli ayırır, ABS'ı gürültü sayar", () => {
    expect(ok("HONDA CBF 500")).toMatchObject({ make: "Honda", model: "Cbf 500" });
    expect(ok("HONDA CBF 500 ABS").modelKey).toBe(ok("HONDA CBF 500").modelKey);
  });

  it("çok kelimeli markaları tanır", () => {
    expect(ok("HARLEY DAVIDSON FLSTF FAT BOY").make).toBe("Harley-Davidson");
    expect(ok("MV AGUSTA BRUTALE 910").make).toBe("MV Agusta");
    expect(ok("ROYAL ENFIELD CLASSIC 500").make).toBe("Royal Enfield");
    // "Royal Alloy" ayrı bir marka — Royal Enfield ile karıştırılmaz
    expect(ok("ROYAL ALLOY TG125 AC CBS").make).toBe("Royal Alloy");
  });

  it("yerli marka adlarını domesticBrands.ts ile birebir eşleştirir", () => {
    expect(ok("KUBA CG 100").make).toBe("Küba Motor");
    expect(ok("ARORA HERKUL 200 T3").make).toBe("Arora");
    expect(ok("ASYA AS 100").make).toBe("Asya");
    expect(ok("MONDIAL 150 ZC").make).toBe("Mondial (TR)");
  });

  it("ATV/UTV/quad satırlarını ve markalarını dışarıda bırakır", () => {
    expect(parseMotoTip("KANUNI ATV 150").ok).toBe(false);
    expect(parseMotoTip("KANUNI ATV200 OFF ROAD").ok).toBe(false); // boşluksuz yazım da yakalanmalı
    expect(parseMotoTip("POLARIS HAWKEYE 300").ok).toBe(false);
    expect(parseMotoTip("MELEX 943 ELEKTRIK").ok).toBe(false);
    expect(parseMotoTip("ASYA HSUN 700 UTV T1").ok).toBe(false);
    expect(parseMotoTip("SUZUKI LTZ 400 QUADSPORT").ok).toBe(false);
    expect(parseMotoTip("SYM QUADLANDER 200").ok).toBe(false);
  });

  it("kelime sınırı olmadan 'QUAD' geçen gerçek isimleri yanlışlıkla eleme", () => {
    // "SQUADRON" içinde QUAD geçiyor ama kelime SINIRIYLA başlamıyor — ATV değil
    expect(ok("ROYAL ENFIELD SQUADRON BLUE").model).toBe("Squadron Blue");
  });

  it("açık işaretle ya da bilinen sadece-elektrikli markayla elektrikli sayar", () => {
    expect(ok("ZERO MOTORCYCLES Z1").yakit).toBe("EV");
    expect(ok("KANUNI MOTO ELEKTRIKLI 3000W").yakit).toBe("EV");
    expect(ok("HONDA CBF 500").yakit).toBe("GASOLINE");
  });
});
