// Otomobil kategorisini genişletmek için tek seferlik toplu ekleme script'i.
// src/data/vehicles.json'daki (Araç Bul/quiz referans verisi) Otomobil listesinden,
// marka başına en fazla PER_BRAND_CAP farklı nameplate (nesil bazında en güncel olanı)
// seçip Product olarak ekler. Mevcut ürünlere DOKUNMAZ (sadece brand/model upsert,
// yeni slug'larda product create). Teknik özellikler (attributes) ve görsel (imageUrl)
// bilinçli olarak BOŞ bırakılır — /admin/urunler ve /admin/araclar'dan sonradan girilir.

import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import vehicles from "../src/data/vehicles.json";

const PER_BRAND_CAP = 15;
const GEN_RANGE_RE = /\s*\((\d{4})\s*[-–—]\s*(\d{4})?\)\s*$/;

function slugify(text: string): string {
  return String(text).toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function baseName(name: string): string {
  return name.replace(GEN_RANGE_RE, "").trim();
}

function representativeYear(name: string): number | null {
  const m = name.match(GEN_RANGE_RE);
  if (!m) return null;
  return m[2] ? parseInt(m[2], 10) : new Date().getFullYear();
}

type VehicleModel = { name: string; versions: string[]; trims: string[] };
type VehicleBrand = { make: string; models: VehicleModel[] };

function pickModelsForBrand(brand: VehicleBrand): VehicleModel[] {
  const byBase = new Map<string, VehicleModel>();
  for (const m of brand.models) {
    if (m.name === "Diğer" || m.name === "Diğer / Bulamadım") continue;
    byBase.set(baseName(m.name), m); // son görülen (kronolojik en yeni nesil) üzerine yazar
  }
  return [...byBase.values()].slice(0, PER_BRAND_CAP);
}

async function main() {
  const category = await prisma.category.findUnique({ where: { slug: "otomobil" } });
  if (!category) throw new Error("Otomobil kategorisi bulunamadı");

  const brands = (vehicles as { otomobil: VehicleBrand[] }).otomobil.filter(
    (b) => b.make !== "Diğer / Bulamadım"
  );

  let created = 0;
  let skippedExisting = 0;

  for (const vb of brands) {
    const brandSlug = slugify(vb.make);
    const brand = await prisma.brand.upsert({
      where: { slug: brandSlug },
      update: {},
      create: { slug: brandSlug, name: vb.make },
    });

    const picked = pickModelsForBrand(vb);

    for (const m of picked) {
      const modelSlug = slugify(`${vb.make}-${m.name}`);
      const model = await prisma.model.upsert({
        where: { slug: modelSlug },
        update: {},
        create: { slug: modelSlug, name: m.name, brandId: brand.id },
      });

      const year = representativeYear(m.name);
      const productSlug = slugify([vb.make, m.name, year].filter(Boolean).join("-"));

      const existing = await prisma.product.findUnique({ where: { slug: productSlug } });
      if (existing) { skippedExisting++; continue; }

      await prisma.product.create({
        data: {
          slug: productSlug,
          name: `${vb.make} ${m.name}`,
          year,
          categoryId: category.id,
          brandId: brand.id,
          modelId: model.id,
          status: "ACTIVE",
          isActive: true,
        },
      });
      created++;
    }
  }

  console.log(JSON.stringify({ created, skippedExisting, brandCount: brands.length }, null, 2));
}

main().finally(() => prisma.$disconnect());
