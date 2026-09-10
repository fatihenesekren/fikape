// tr-TR biçimlendirme + ISO hafta penceresi yardımcıları (haftalık rapor).
// Tüm pencere matematiği UTC — Türkiye DST kullanmıyor (sabit UTC+3), bu yüzden
// "hafta" tanımı olarak UTC Pazartesi 00:00 sınırları yeterli; footer'da yazılıyor.

const TR_MONTHS_LONG = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];
const TR_MONTHS_SHORT = [
  "Oca", "Şub", "Mar", "Nis", "May", "Haz",
  "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara",
];

const nfInt = new Intl.NumberFormat("tr-TR");
const nfPct = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 1 });

export function fmtInt(n: number): string {
  return nfInt.format(Math.round(n));
}

/** "%8,1" — Türkçe'de % işareti önde. */
export function fmtPct(ratio: number, digits = 1): string {
  const nf = digits === 1 ? nfPct : new Intl.NumberFormat("tr-TR", { maximumFractionDigits: digits });
  return `%${nf.format(ratio * 100)}`;
}

export interface Delta {
  arrow: string;   // ▲ ▼ —
  text: string;    // "▲ +12% (+134)" | "▲ +3" | "— 0" | "yeni"
  color: "up" | "down" | "flat";
}

/**
 * `goodDir` metriğin İYİ yönü — ok her zaman gerçek sayısal harekete göre,
 * renk iyi/kötüye göre. `goodDir: "none"` → renk her zaman nötr.
 */
export function delta(
  value: number,
  prev: number,
  goodDir: "up" | "down" | "none" = "up",
): Delta {
  const d = value - prev;
  const up = d > 0;
  const down = d < 0;
  const arrow = up ? "▲" : down ? "▼" : "—"; // ▲ ▼ —
  const sign = up ? "+" : down ? "−" : "±"; // + − ±
  const abs = Math.abs(d);

  let text: string;
  if (prev === 0) {
    text = value > 0 ? "yeni" : "— 0";
  } else {
    const pct = Math.round((d / prev) * 100);
    text = `${arrow} ${sign}${Math.abs(pct)}% (${sign}${fmtInt(abs)})`;
  }
  if (prev !== 0 && d === 0) text = "— 0%";

  let color: Delta["color"] = "flat";
  if (goodDir !== "none" && d !== 0) {
    const isGood = goodDir === "up" ? up : down;
    color = isGood ? "up" : "down";
  }
  return { arrow, text, color };
}

/** Oran metrikleri için "puan" farkı (yüzde puanı, % değil). */
export function pointDelta(value: number, prev: number, goodDir: "up" | "down" | "none" = "up"): Delta {
  const d = Math.round((value - prev) * 1000) / 10; // yüzde puanı, 1 ondalık
  const up = d > 0, down = d < 0;
  const arrow = up ? "▲" : down ? "▼" : "—";
  const sign = up ? "+" : down ? "−" : "±";
  const text = d === 0 ? "— 0 puan" : `${arrow} ${sign}${Math.abs(d).toString().replace(".", ",")} puan`;
  let color: Delta["color"] = "flat";
  if (goodDir !== "none" && d !== 0) color = (goodDir === "up" ? up : down) ? "up" : "down";
  return { arrow, text, color };
}

// ── ISO hafta penceresi ───────────────────────────────────────────

function utcMidnight(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

export function isoWeekString(date: Date): string {
  const d = utcMidnight(date);
  const dayNum = d.getUTCDay() || 7; // Pzt=1..Paz=7
  d.setUTCDate(d.getUTCDate() + 4 - dayNum); // o haftanın Perşembesi
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

export interface WeekWindow {
  /** raporlanan haftanın başı — geçen Pazartesi 00:00 UTC (dahil) */
  weekStart: Date;
  /** raporlanan haftanın sonu — bu Pazartesi 00:00 UTC (hariç) */
  weekEnd: Date;
  prevStart: Date;
  prevEnd: Date;
  isoWeek: string;
  /** "8–14 Eylül 2026" */
  rangeLabel: string;
}

/**
 * Cron Pazartesi sabahı ateşlenir → "bu hafta" = az önce biten 7 gün
 * = [geçen Pzt 00:00 UTC, bu Pzt 00:00 UTC).
 */
export function isoWeekWindow(now: Date = new Date()): WeekWindow {
  const d = utcMidnight(now);
  const dow = d.getUTCDay() || 7;
  const thisMonday = new Date(d);
  thisMonday.setUTCDate(d.getUTCDate() - dow + 1);

  const weekEnd = thisMonday;
  const weekStart = new Date(weekEnd);
  weekStart.setUTCDate(weekEnd.getUTCDate() - 7);
  const prevEnd = new Date(weekStart);
  const prevStart = new Date(weekStart);
  prevStart.setUTCDate(weekStart.getUTCDate() - 7);

  return {
    weekStart,
    weekEnd,
    prevStart,
    prevEnd,
    isoWeek: isoWeekString(weekStart),
    rangeLabel: weekRangeLabel(weekStart, weekEnd),
  };
}

/** weekStart dahil, weekEnd hariç → gösterilen aralık son gün = weekEnd − 1 gün. */
export function weekRangeLabel(weekStart: Date, weekEnd: Date): string {
  const last = new Date(weekEnd);
  last.setUTCDate(weekEnd.getUTCDate() - 1);

  const sD = weekStart.getUTCDate(), sM = weekStart.getUTCMonth(), sY = weekStart.getUTCFullYear();
  const eD = last.getUTCDate(), eM = last.getUTCMonth(), eY = last.getUTCFullYear();

  if (sY === eY && sM === eM) return `${sD}–${eD} ${TR_MONTHS_LONG[sM]} ${sY}`;
  if (sY === eY) return `${sD} ${TR_MONTHS_SHORT[sM]} – ${eD} ${TR_MONTHS_SHORT[eM]} ${sY}`;
  return `${sD} ${TR_MONTHS_SHORT[sM]} ${sY} – ${eD} ${TR_MONTHS_SHORT[eM]} ${eY}`;
}
