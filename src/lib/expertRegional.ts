// ─────────────────────────────────────────────
// USTA GÖRÜŞLERI — Bölgesel görünürlük yüzeyi (Aşama 9, plan §9 + §18).
// Yalnız FEATURED ustaların notları bu bloğa girer (görüntülenen ANA not
// listesi ise durumdan bağımsız hep görünür — bu blok ayrı, ek bir katman).
//
// Sert kapı (§18): bölgesel başlık yalnız aynı ildeki ≥3 farklı FEATURED
// usta bu modele not yazmışsa açılır. Altındaysa "Türkiye geneli" — o da
// yalnız ≥1 FEATURED usta varsa gösterilir, yoksa blok tamamen gizlenir.
// ─────────────────────────────────────────────

export const MIN_DISTINCT_EXPERTS_REGIONAL = 3;
export const MAX_REGIONAL_ENTRIES = 5;

export interface RegionalNoteInput {
  id: number;
  title: string;
  publishedAt: string; // ISO, sıralama için
  authorUserId: number;
  authorName: string;
  authorSlug: string | null;
  city: string | null;
}

export interface RegionalSummaryEntry {
  noteId: number;
  authorName: string;
  authorSlug: string | null;
  title: string;
}

export interface RegionalSummary {
  city: string | null; // null = Türkiye geneli fallback
  sortLabel: string;
  totalExperts: number;
  entries: RegionalSummaryEntry[];
}

export function buildRegionalSummary(
  featuredNotes: RegionalNoteInput[],
  userCity: string | null
): RegionalSummary | null {
  if (featuredNotes.length === 0) return null;

  if (userCity) {
    const inRegion = featuredNotes.filter((n) => n.city === userCity);
    const distinctExperts = new Set(inRegion.map((n) => n.authorUserId));
    if (distinctExperts.size >= MIN_DISTINCT_EXPERTS_REGIONAL) {
      const byUsta = new Map<number, RegionalNoteInput[]>();
      for (const n of inRegion) {
        const arr = byUsta.get(n.authorUserId) ?? [];
        arr.push(n);
        byUsta.set(n.authorUserId, arr);
      }
      const ranked = [...byUsta.values()]
        .map((notes) => {
          const latest = notes.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))[0];
          return {
            noteId: latest.id, authorName: latest.authorName, authorSlug: latest.authorSlug,
            title: latest.title, noteCount: notes.length,
          };
        })
        .sort((a, b) => b.noteCount - a.noteCount)
        .slice(0, MAX_REGIONAL_ENTRIES);
      const entries: RegionalSummaryEntry[] = ranked.map((r) => ({
        noteId: r.noteId, authorName: r.authorName, authorSlug: r.authorSlug, title: r.title,
      }));
      return { city: userCity, sortLabel: "bu modeldeki not sayısına göre", totalExperts: distinctExperts.size, entries };
    }
  }

  // Fallback: Türkiye geneli — yalnız ≥1 FEATURED usta varsa
  const distinctNational = new Set(featuredNotes.map((n) => n.authorUserId));
  if (distinctNational.size === 0) return null;

  const sorted = featuredNotes.slice().sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
  const seen = new Set<number>();
  const entries: RegionalSummaryEntry[] = [];
  for (const n of sorted) {
    if (seen.has(n.authorUserId)) continue;
    seen.add(n.authorUserId);
    entries.push({ noteId: n.id, authorName: n.authorName, authorSlug: n.authorSlug, title: n.title });
    if (entries.length >= MAX_REGIONAL_ENTRIES) break;
  }
  return { city: null, sortLabel: "katkı tarihine göre", totalExperts: distinctNational.size, entries };
}
