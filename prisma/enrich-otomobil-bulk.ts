// Tek seferlik toplu zenginleştirme: seed-otomobil-bulk.ts ile eklenen,
// görseli boş olan Otomobil ürünlerini Wikidata'dan üretici+model doğrulamalı
// şekilde bulunan görsellerle doldurur (bkz. src/lib/wikidataImage.ts).
//
// ÖNEMLİ: Eski Wikipedia düz-metin-arama yöntemi yanlış eşleşmeler üretiyordu
// (ör. Abarth modellerine Fiat fotoğrafı, farklı Alfa Romeo nesillerine aynı/
// yanlış fotoğraf, bazı modellere sadece marka logosu). Bu script SADECE tek
// ve doğrulanmış bir aday bulunduğunda görsel yazar — belirsizlik varsa boş
// bırakır, TAHMİN ETMEZ.
//
// Teknik özellikler (attributes) bu script'te DOLDURULMUYOR — CarQuery API'si
// kalıcı olarak erişilemez durumda, Wikipedia tablo taraması hem çok düşük
// verim (497'de 2) hem de aynı belirsizlik riskini taşıyor. Teknik özellikler
// için güvenilir bir ücretsiz kaynak yok; /admin/urunler üzerinden elle
// girilmesi gerekiyor.

import "dotenv/config";
import { prisma } from "../src/lib/prisma";
import { findVerifiedVehicleImage } from "../src/lib/wikidataImage";

type Row = { slug: string; brand: string; model: string; year: number | null; imageFound: boolean };

async function main() {
  const products = await prisma.product.findMany({
    where: { status: "ACTIVE", isActive: true, category: { slug: "otomobil" }, imageUrl: null },
    include: { brand: true, model: true },
    orderBy: [{ brand: { name: "asc" } }, { model: { name: "asc" } }],
  });

  console.log(`İşlenecek araç: ${products.length}`);

  const rows: Row[] = [];
  let i = 0;

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (const p of products) {
    i++;
    const brand = p.brand.name;
    const model = p.model.name;

    let imageFound = false;
    const img = await findVerifiedVehicleImage(brand, model, p.year);
    if (img) {
      await prisma.product.update({ where: { id: p.id }, data: { imageUrl: img } });
      imageFound = true;
    }

    rows.push({ slug: p.slug, brand, model, year: p.year, imageFound });

    if (i % 25 === 0) {
      console.log(`  ... ${i}/${products.length} işlendi`);
    }

    // Wikidata rate-limit'ine takılmamak için ürünler arası bekleme
    await sleep(1200);
  }

  const imagesFound = rows.filter((r) => r.imageFound).length;
  const stillEmpty = rows.filter((r) => !r.imageFound);

  console.log("\n=== RAPOR ===");
  console.log(JSON.stringify({ totalProcessed: rows.length, imagesFound, stillEmptyCount: stillEmpty.length }, null, 2));

  console.log("\n=== GÖRSEL BULUNAMAYAN ARAÇLAR (elle /admin/araclar'dan doldurulacak) ===");
  console.log(JSON.stringify(stillEmpty.map((r) => `${r.brand} ${r.model}`), null, 2));
}

main().finally(() => prisma.$disconnect());
