/**
 * Motosiklet için TSB ayrıştırma sözlükleri.
 *
 * Otomobilden farklı olarak TSB motosikletleri TEK "MOTORSIKLET" başlığı
 * altında tutuyor; marka tip adının İLK kelimesi(leri). Ayrıca motor kodu
 * model adının kendisine gömülü olduğu için ("CBF 500", "FLSTF FAT BOY")
 * otomobildeki gibi motor/paket ayrımı YAPILMIYOR — bkz. parseMotoTip.ts.
 */
import { fold } from "./rules";

// ─── Kapsam dışı (motosiklet değil) ────────────────────────────────────────

/** Satırda bu kelimelerden biri geçiyorsa araç ATV/UTV/quad/buggy — motosiklet değil. */
// ATV/UTV/QUAD yalnız BAŞTA sınır ister ("ATV200", "QUADSPORT", "QUADLANDER"
// da yakalanır) — sonda sınır aranmaz. "SQUADRON" gibi kelimeler QUAD kelime
// SINIRIYLA başlamadığı için (önündeki S bitişik) yanlışlıkla eşleşmez.
export const MOTO_DISHI_RE =
  /\bATV|\bUTV|\bQUAD|\bBUGGY\b|\bSSV\b|\bGOKART|\bGO-KART|\bKARTING\b|\bQCAR\b|\bQ CAR\b|GOLF ARAC|4 ?X ?4|4\s?TEKER|DORT TEKER/;

/** ATV/UTV/golf aracı/mikro-araba üreten markalar (motosiklet hattı yok). */
export const MOTO_DISHI_MARKALAR = new Set([
  "POLARIS", "BRP", "CANAM", "MELEX", "GEM", "GOUPIL", "CARVER", "MICROLINO",
  "VANDERHALL", "TAZZARI", "PILOTCAR", "BOMBARDIER", "CENNTRO", "REEDER", "AIXAM",
]);

// ─── Marka ────────────────────────────────────────────────────────────────

/** Birden fazla kelimeden oluşan marka adları — en uzun eşleşme önce denenir. */
export const MOTO_COK_KELIMELI_MARKALAR: [string, string][] = [
  ["MV AGUSTA", "MV Agusta"],
  ["MOTO GUZZI", "Moto Guzzi"],
  ["MOTO MORINI", "Moto Morini"],
  ["REGAL RAPTOR", "Regal Raptor"],
  ["HARLEY DAVIDSON", "Harley-Davidson"],
  ["ROYAL ENFIELD", "Royal Enfield"],
  ["ROYAL ALLOY", "Royal Alloy"],
  ["SUPER SOCO", "Super Soco"],
  ["GAS GAS", "Gas Gas"],
  ["QJ MOTOR", "QJMotor"],
  ["ZERO MOTORCYCLES", "Zero Motorcycles"],
  ["STARK FUTURE", "Stark Future"],
  ["HERO MOTOCORP", "Hero MotoCorp"],
  ["PEUGEOT MOTOCYCLES", "Peugeot Motorcycles"],
  ["SUR RON", "Sur-Ron"],
  ["CAN AM", "Can-Am"],
];

/** Tek kelimelik marka adlarının katalogdaki (ve yerli marka listesindeki) tam yazımı. */
export const MOTO_MARKA_ALIAS: Record<string, string> = {
  KUBA: "Küba Motor", // yerli marka — domesticBrands.ts ile birebir eşleşmeli
  KANUNI: "Kanuni", // yerli marka
  ARORA: "Arora", // yerli marka
  ASYA: "Asya", // yerli marka
  MONDIAL: "Mondial (TR)", // yerli marka — İtalyan "FB Mondial" TSB'de ayrı/yok
  HERO: "Hero MotoCorp",
  CFMOTO: "CF Moto",
  GASGAS: "Gas Gas",
  PEUGEOT: "Peugeot Motorcycles",
  KYMCO: "KYMCO",
  SYM: "SYM",
  KTM: "KTM",
  BMW: "BMW",
  TVS: "TVS",
  MV: "MV Agusta", // "MV" tek başına gelirse (nadiren) yine MV Agusta'dır
  // Kaynak yazım hataları / bitişik yazımlar (TSB'nin kendi verisi)
  APRILA: "Aprilia",
  HARLEYDAVIDSON: "Harley-Davidson",
  HUSQAVARNA: "Husqvarna",
  MOTOGUZZI: "Moto Guzzi",
  MVAGUSTO: "MV Agusta",
  TRUIMPH: "Triumph",
  BAJAJA: "Bajaj",
};

export const foldMoto = fold;

// ─── Model temizliği ────────────────────────────────────────────────────
/**
 * Modelden atılan saf gürültü — bir donanım/motor bilgisi TAŞIMAYAN kelimeler.
 * ABS burada BİLİNÇLİ olarak var: otomobildeki gibi motor/paket ayrımı
 * yapmıyoruz, "ABS" gibi tek kelimelik farkları ayrı model saymak model
 * listesini anlamsızca şişirir (bkz. kullanıcı onayı).
 */
export const MOTO_GURULTU_RE =
  /^(ABS|E[3456](\.\d)?|EURO ?[3456]|STT|S&S|FL|MCA|MCAI|MC|YENI|NEW|MY\d{2}|\(Y\))$/;

/** Motosiklette elektrikli olduğunu gösteren kesin işaretler. */
export const MOTO_EV_RE = /\b(ELEKTRIK|ELEKTRIKLI|ELECTRIC)\b|\d+(\.\d+)?\s?KWH\b/;

/**
 * Yalnızca elektrikli motosiklet üreten, tartışmasız bilinen markalar — tip
 * adında işaret olmasa bile elektrikli sayılır (Zero Motorcycles hiç içten
 * yanmalı model satmadı, vb.). Emin olunmayan marka BURAYA EKLENMEZ.
 */
export const MOTO_SADECE_EV_MARKALAR = new Set([
  "Zero Motorcycles", "Energica", "Stark Future", "Sur-Ron", "Super Soco", "Silence",
]);
