import { prisma } from "@/lib/prisma";

// Arama sorgusu logu — sıfır-sonuç ("kataloğa aday") + popüler terim analizi
// için. Kişisel veri YOK: normalize edilmiş terim + sonuç sayısı + kaynak.
// Fire-and-forget: yanıtı asla bloklamaz / hata fırlatmaz.

export type SearchSource = "arama" | "araclar";

const MAX_TERM_LEN = 200;

/** trim → küçük harf (tr) → boşluk sadeleştirme → uzunluk sınırı. */
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").slice(0, MAX_TERM_LEN);
}

export function logSearch(rawTerm: string, resultCount: number, source: SearchSource): void {
  const term = normalizeSearchTerm(rawTerm);
  if (term.length < 2) return;
  if (!Number.isFinite(resultCount) || resultCount < 0) return;

  void prisma.searchQueryLog
    .create({ data: { term, resultCount: Math.min(resultCount, 9999), source } })
    .catch(() => {});
}
