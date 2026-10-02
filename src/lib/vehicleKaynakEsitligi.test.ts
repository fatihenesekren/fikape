import { describe, expect, it } from "vitest";
import fs from "fs";
import path from "path";
import vehicles from "@/data/vehicles.json";

// scripts/vehicle-data/<kategori>/<marka>.json kaynak dosyaları ile src/data/vehicles.json birebir aynı kalmalı:
// aksi halde `merge.ts` çalıştırıldığında vehicles.json'daki düzeltmeler (aksan sadeleştirme vb.) sessizce geri alınır.
const KATEGORILER = ["otomobil", "motosiklet", "kamyonet", "e-scooter", "e-bisiklet", "karavan"] as const;
type Kayit = { make: string; models: unknown[] };

describe("araç kaynak dosyaları vehicles.json ile eşit", () => {
  for (const kat of KATEGORILER) {
    it(`${kat}: her marka dosyası vehicles.json kaydıyla aynı`, () => {
      const dir = path.join(process.cwd(), "scripts", "vehicle-data", kat);
      const json = (vehicles as unknown as Record<string, Kayit[]>)[kat];
      const farkli: string[] = [];
      const gorulen = new Set<string>();
      for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
        const kaynak = JSON.parse(fs.readFileSync(path.join(dir, f), "utf-8")) as Kayit;
        gorulen.add(kaynak.make);
        const hedef = json.find((m) => m.make === kaynak.make);
        if (!hedef) farkli.push(`${f}: vehicles.json'da yok`);
        else if (JSON.stringify(hedef) !== JSON.stringify(kaynak)) farkli.push(`${f}: içerik farklı`);
      }
      for (const m of json) if (!gorulen.has(m.make)) farkli.push(`${m.make}: kaynak dosyası yok`);
      expect(farkli).toEqual([]);
    });
  }
});
