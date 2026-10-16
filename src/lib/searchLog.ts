import { prisma } from "@/lib/prisma";

// Arama sorgusu logu — sıfır-sonuç ("kataloğa aday") + popüler terim analizi
// için. Kişisel veri YOK: normalize edilmiş terim + sonuç sayısı + kaynak.
// Fire-and-forget: yanıtı asla bloklamaz / hata fırlatmaz.

// "cip": boş arama ekranı / ana sayfadaki hazır "Popüler aramalar" çipi (organik arama istatistiğinden ayrı tutulur)
export type SearchSource = "arama" | "araclar" | "cip";

const MAX_TERM_LEN = 200;

/** trim → küçük harf (tr) → boşluk sadeleştirme → uzunluk sınırı. */
export function normalizeSearchTerm(raw: string): string {
  return raw.trim().toLocaleLowerCase("tr-TR").replace(/\s+/g, " ").slice(0, MAX_TERM_LEN);
}

// Kötüye kullanıma karşı örnek (instance) başına sınırlar: aynı terim 1 dakikada bir, toplam dakikada en çok 120 satır.
// Tablo herkese açık GET isteğiyle büyüdüğü için sınırsız yazım DB'yi şişirebilirdi.
const SON_YAZIM = new Map<string, number>();
let pencereBasi = 0;
let pencereSayisi = 0;
const TERIM_ARALIGI_MS = 60_000;
const DAKIKA_UST_SINIR = 120;

function yazilabilirMi(term: string, simdi: number): boolean {
  if (simdi - pencereBasi > 60_000) { pencereBasi = simdi; pencereSayisi = 0; }
  if (pencereSayisi >= DAKIKA_UST_SINIR) return false;
  const son = SON_YAZIM.get(term);
  if (son !== undefined && simdi - son < TERIM_ARALIGI_MS) return false;
  if (SON_YAZIM.size > 2000) SON_YAZIM.clear();
  SON_YAZIM.set(term, simdi);
  pencereSayisi++;
  return true;
}

export function logSearch(rawTerm: string, resultCount: number, source: SearchSource): void {
  const term = normalizeSearchTerm(rawTerm);
  if (term.length < 2) return;
  if (!Number.isFinite(resultCount) || resultCount < 0) return;
  if (!yazilabilirMi(term, Date.now())) return;

  void prisma.searchQueryLog
    .create({ data: { term, resultCount: Math.min(resultCount, 9999), source } })
    .catch(() => {});
}
