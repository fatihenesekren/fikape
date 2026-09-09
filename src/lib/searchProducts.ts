import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

// Ürün metin araması — DB tarafında `unaccent()` + (sıfır sonuçta) `pg_trgm`
// benzerlik fallback'i. `/api/search/products/route.ts`'teki desenle aynı
// yaklaşım; buradaki fark: `trimName` de eşleşir, `İ/I/ı` translate() ile
// düzleştirilir, `LIKE` metakarakterleri kaçırılır ve sonuç yalnızca ürün id
// listesidir (çağıran taraf zenginleştirmeyi kendi yapar).
//
// Not: mevcut GIN trgm index'leri ham `name` kolonunda; `unaccent(translate(...))`
// sarmalı onları kullanamaz → bilinçli seq scan. Katalog küçük (~1k satır),
// sorun değil. İfade index'i ancak katalog ~5-10k satırı geçerse gerekir
// (o zaman IMMUTABLE `unaccent` sarmalı + GIN — ayrı iş, bkz. plan).

const MAX_QUERY_LEN = 128;
const MAX_TERMS = 6;
const FUZZY_MAX_TERMS = 2;          // tüm-cümle similarity 2 kelimeden sonra güvenilmez
const FUZZY_MIN_SIMILARITY = 0.45;  // sonuç sayfasında "benzer" göstermek için taban
const EXACT_LIMIT = 60;
const FUZZY_LIMIT = 10;

export interface ProductSearchResult {
  ids: number[];
  /** true = id'ler pg_trgm typo-toleranslı fallback'ten geldi (tam/substring eşleşme yok). */
  fuzzy: boolean;
}

/** `LIKE` metakarakterlerini (\ % _) kaçır — "%100" yazan kullanıcı tüm kataloğu getirmesin. */
export function escapeLike(s: string): string {
  return s.replace(/[\\%_]/g, "\\$&");
}

/** Ham sorgu → güvenli terim listesi: trim → uzunluk sınırı → kelimelere böl → sayı sınırı. */
export function prepareSearchTerms(raw: string): string[] {
  const q = (raw ?? "").trim().slice(0, MAX_QUERY_LEN);
  if (q.length < 2) return [];
  return q.split(/\s+/).filter(Boolean).slice(0, MAX_TERMS);
}

export async function searchProductIds(rawQuery: string): Promise<ProductSearchResult> {
  const terms = prepareSearchTerms(rawQuery);
  if (terms.length === 0) return { ids: [], fuzzy: false };

  // ── Faz 1: substring — her terim ad / trim / model / marka alanlarından birinde geçmeli (AND) ──
  const termClauses = terms.map((term) => {
    const pat = `%${escapeLike(term)}%`;
    return Prisma.sql`(
      unaccent(translate(p.name, 'İIı', 'iii'))        ILIKE unaccent(translate(${pat}, 'İIı', 'iii'))
      OR unaccent(translate(p."trimName", 'İIı', 'iii')) ILIKE unaccent(translate(${pat}, 'İIı', 'iii'))
      OR unaccent(translate(m.name, 'İIı', 'iii'))     ILIKE unaccent(translate(${pat}, 'İIı', 'iii'))
      OR unaccent(translate(b.name, 'İIı', 'iii'))     ILIKE unaccent(translate(${pat}, 'İIı', 'iii'))
    )`;
  });

  const exact = await prisma.$queryRaw<{ id: number }[]>`
    SELECT p.id
    FROM "products" p
    JOIN "models" m ON m.id = p."modelId"
    JOIN "brands" b ON b.id = p."brandId"
    WHERE p."isActive" = true
      AND ${Prisma.join(termClauses, " AND ")}
    ORDER BY b.name ASC, p."year" DESC
    LIMIT ${EXACT_LIMIT}
  `;
  if (exact.length > 0) {
    return { ids: exact.map((r) => r.id), fuzzy: false };
  }

  // ── Faz 2: pg_trgm benzerlik fallback (yalnızca kısa sorgularda) ──
  if (terms.length > FUZZY_MAX_TERMS) return { ids: [], fuzzy: false };
  const fq = terms.join(" ");
  const sim = Prisma.sql`GREATEST(
    similarity(unaccent(translate(b.name, 'İIı', 'iii')), unaccent(translate(${fq}, 'İIı', 'iii'))),
    similarity(unaccent(translate(m.name, 'İIı', 'iii')), unaccent(translate(${fq}, 'İIı', 'iii'))),
    similarity(unaccent(translate(p.name, 'İIı', 'iii')), unaccent(translate(${fq}, 'İIı', 'iii')))
  )`;
  const fuzzyRows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT p.id
    FROM "products" p
    JOIN "models" m ON m.id = p."modelId"
    JOIN "brands" b ON b.id = p."brandId"
    WHERE p."isActive" = true AND ${sim} >= ${FUZZY_MIN_SIMILARITY}
    ORDER BY ${sim} DESC
    LIMIT ${FUZZY_LIMIT}
  `;
  return { ids: fuzzyRows.map((r) => r.id), fuzzy: fuzzyRows.length > 0 };
}
