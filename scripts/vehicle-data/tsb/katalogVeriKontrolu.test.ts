import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";

// Üretilen public/katalog verisinde versiyon metninde (KatalogTip.v) aynı
// kelimenin tekrar etmesi, kullanıcıya "sDrive16d 1.5 sDrive" gibi anlamsız
// bir metin olarak gösteriliyordu (bkz. kullanıcı geri bildirimi, BMW X1
// sDrive16d, 2026-09-27). Bu test her `npx vitest run`'da otomatik çalışır —
// build.ts/katalog.ts'in gelecekte tekrar ürettiği yeni bir tekrar burada
// yakalanır, canlıda kullanıcı bulmadan önce.
const KATALOG_DIRS = ["otomobil", "kamyonet"];
const root = path.join(process.cwd(), "public", "katalog");

function versiyonTekrarlari(): string[] {
  const bulunanlar: string[] = [];
  for (const kategori of KATALOG_DIRS) {
    const dir = path.join(root, kategori);
    if (!fs.existsSync(dir)) continue;
    for (const dosya of fs.readdirSync(dir)) {
      if (!dosya.endsWith(".json")) continue;
      const data = JSON.parse(fs.readFileSync(path.join(dir, dosya), "utf8")) as {
        marka: string;
        modeller: { ad: string; tipler: { v: string | null }[] }[];
      };
      for (const model of data.modeller) {
        for (const tip of model.tipler) {
          if (!tip.v) continue;
          const kelimeler = tip.v.toLowerCase().split(/\s+/);
          const gorulen = new Set<string>();
          for (const k of kelimeler) {
            if (k.length <= 2) continue; // "v6", "2.0" gibi kısa/sayısal kodlar yanlış-pozitif üretebilir
            if (gorulen.has(k)) { bulunanlar.push(`${data.marka} ${model.ad}: "${tip.v}"`); break; }
            gorulen.add(k);
          }
        }
      }
    }
  }
  return bulunanlar;
}

describe("katalog veri kontrolü", () => {
  it("üretilen versiyon metinlerinde tekrarlanan kelime olmamalı", () => {
    expect(versiyonTekrarlari()).toEqual([]);
  });
});
