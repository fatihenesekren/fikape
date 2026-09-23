import { describe, it, expect } from "vitest";
import vehicles from "@/data/vehicles.json";

type CatalogModel = {
  name: string;
  versions: string[];
  trims: string[];
  trimsByVersion?: Record<string, string[]>;
};
type CatalogMake = { make: string; models: CatalogModel[] };

const catalog = vehicles as unknown as Record<string, CatalogMake[]>;

describe("vehicles.json katalog bütünlüğü", () => {
  it("trimsByVersion anahtarları modelin versiyon listesinde var", () => {
    // Anahtar versiyonla birebir eşleşmezse (yazım farkı, yeniden adlandırma)
    // o versiyon sessizce tüm paket listesine düşer — eşleme boşa gider.
    const orphans: string[] = [];
    for (const [cat, makes] of Object.entries(catalog)) {
      for (const mk of makes) {
        for (const m of mk.models) {
          for (const key of Object.keys(m.trimsByVersion ?? {})) {
            if (!m.versions.includes(key)) orphans.push(`${cat}/${mk.make}/${m.name}: ${key}`);
          }
        }
      }
    }
    expect(orphans).toEqual([]);
  });

  it("bir markada aynı model adı tekrar etmez", () => {
    const dups: string[] = [];
    for (const [cat, makes] of Object.entries(catalog)) {
      for (const mk of makes) {
        const seen = new Set<string>();
        for (const m of mk.models) {
          if (seen.has(m.name)) dups.push(`${cat}/${mk.make}/${m.name}`);
          seen.add(m.name);
        }
      }
    }
    expect(dups).toEqual([]);
  });
});
