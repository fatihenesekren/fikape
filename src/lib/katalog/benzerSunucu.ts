import { prisma } from "@/lib/prisma";
import katalogIndex from "@/data/katalogIndex.json";
import type { KatalogIndex } from "@/lib/katalog/tipler";
import { benzerUyarilar } from "@/lib/katalog/benzerlik";
import { adAnahtar } from "@/lib/katalog/ek";
import { slugify } from "@/lib/slugify";

const INDEX = katalogIndex as KatalogIndex;

/** Yeni/değişen marka-model-donanım adı için yazım benzerliği uyarıları (resmi katalog + veritabanı adlarıyla karşılaştırır). */
export async function benzerUyarilariGetir(g: { kategori: string; marka: string; model: string; trim: string | null }): Promise<string[]> {
  const kat = (INDEX as Record<string, KatalogIndex["otomobil"] | undefined>)[g.kategori] ?? [];
  const statikMarkalar = kat.map((m) => m.marka).filter((m) => m !== "Diğer / Bulamadım");
  const markaKey = adAnahtar(g.marka);
  const statikModeller = kat.find((m) => adAnahtar(m.marka) === markaKey)?.modeller ?? [];
  const dbMarkalar = await prisma.brand.findMany({ select: { name: true, models: { select: { name: true } } } });
  const dbMarka = dbMarkalar.find((b) => adAnahtar(b.name) === markaKey);
  const trimler = dbMarka
    ? (await prisma.product.findMany({
        where: { status: "ACTIVE", brand: { slug: slugify(dbMarka.name) } },
        select: { trimName: true },
        take: 500,
      })).map((p) => p.trimName).filter((t): t is string => !!t)
    : [];
  return benzerUyarilar({
    brand: g.marka, model: g.model, trim: g.trim,
    markalar: [...new Set([...statikMarkalar, ...dbMarkalar.map((b) => b.name)])],
    modeller: [...new Set([...statikModeller, ...(dbMarka?.models.map((m) => m.name) ?? [])])],
    trimler,
  });
}
