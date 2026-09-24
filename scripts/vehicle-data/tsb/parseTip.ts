/**
 * Tek bir TSB tip adını (ör. "EGEA SEDAN URBAN 1.6 E-TORQ 110 AT6") katalog
 * alanlarına ayırır: model, kasa, motor, beygir, çekiş, paket, yakıt, vites.
 *
 * Yakıt ve vites YALNIZCA kesin bir işaret varsa doldurulur:
 *   "tsb"          — tip adında açıkça yazıyor (AT6, TDI, HYBRID…)
 *   "kural-model"  — model yalnızca tek yakıtla satılıyor (Tesla, Taycan…)
 *   "kural-ev"     — elektrikli araç: vites fiziksel olarak tek oranlı
 * Aksi halde alan null kalır — Araç Öner'de kullanıcıya sorulur. Tahmin yok.
 */
import {
  AMT_RE, AUTO_RE, AUTO_TWO_WORDS, CVT_RE, BODY_WORDS, BRAND_MAP, CONFIG_RE, DEGLUE_EXCEPTIONS, DRIVE_WORDS, ENGINE_CODE_RE, ENGINE_WORDS,
  EV_ONLY_MODELS, EXCLUDED_BRANDS, FUEL_RULES, GUCLU_BENZIN_RE, GUCLU_DIZEL_RE, HEAVY_RE, KEEP_UPPER, LCV_CODE_RE_BY_MODEL,
  LCV_MODELS, LCV_WORDS_RE, MANUAL_RE, MODEL_ALIASES, MODEL_DISPLAY, MULTI_WORD_MODELS, NOISE_RE,
  START_NOISE_RE, SUB_BRANDS, TYPO_FIXES, VOLVO_CODE_RE, fold,
} from "./rules";

export type Yakit = "GASOLINE" | "DIESEL" | "HYBRID" | "PHEV" | "EV" | "LPG";
export type Vites = "MANUAL" | "AUTOMATIC";
/** Araç Öner formundaki vites seçenekleriyle birebir aynı değerler. */
export type VitesTuru = "Manuel" | "Otomatik" | "CVT" | "Yarı Otomatik";
/**
 * "kural-adlandirma": tip adında motor hacmi var ama hiçbir dizel/hibrit/elektrik
 * işareti yok → benzinli. Resmi tip adları dizeli her zaman yazdığı için
 * güçlü bir kural ama TAHMİNDİR; ayrı etiketlenir, denetimde ayrıca ölçülür.
 */
export type AlanKaynagi = "tsb" | "kural-model" | "kural-ev" | "kural-adlandirma" | null;

export type ParsedTip = {
  make: string;
  category: "otomobil" | "kamyonet";
  /** Karşılaştırma anahtarı (BÜYÜK HARF). */
  modelKey: string;
  model: string;
  kasa: string | null;
  motor: string | null;
  hp: number | null;
  kw: number | null;
  bataryaKwh: number | null;
  cekis: string | null;
  paket: string | null;
  /** Tip adında modelin hemen ardından yazılan nesil eki ("FOCUS III" → "III"). */
  nesil: string | null;
  yakit: Yakit | null;
  yakitKaynak: AlanKaynagi;
  vites: Vites | null;
  vitesKaynak: AlanKaynagi;
  /** Vitesin formdaki karşılığı; vites null ise null. */
  vitesTuru: VitesTuru | null;
  /** Vites/emisyon işaretleri atılmış tip adı — kardeş satır eşleştirmesi için. */
  vitessizAnahtar: string;
  /** Kaynağa uygulanan düzeltmeler (yazım hatası / bitişik kelime). */
  duzeltmeler: string[];
  uyarilar: string[];
};

export type ParseResult = { ok: true; value: ParsedTip } | { ok: false; neden: string };

/** Bitişik yazılmış kelimeyi parçalara ayırır; ayıramazsa null. build.ts sözlükten üretir. */
export type Deglue = (token: string) => string[] | null;

// ─── Yazım ────────────────────────────────────────────────────────────────

function titleWord(w: string): string {
  if (KEEP_UPPER.has(w)) return w;
  if (ENGINE_WORDS[w]) return ENGINE_WORDS[w];
  // "1.6I" → "1.6i", "320D" → "320d"; "1.5T" büyük kalır (turbo)
  if (/^\d+(\.\d+)?[ID]$/.test(w)) return w.slice(0, -1) + w.slice(-1).toLowerCase();
  if (/\d/.test(w)) return w;
  return w
    .split(/([-/.+&])/)
    .map((p) => (/^[A-Z]+$/.test(p) ? (KEEP_UPPER.has(p) ? p : p[0] + p.slice(1).toLocaleLowerCase("en")) : p))
    .join("");
}

export const titleCase = (s: string) => s.split(" ").filter(Boolean).map(titleWord).join(" ");

const displayModel = (key: string) => MODEL_DISPLAY[key] ?? titleCase(key);

// ─── Model ────────────────────────────────────────────────────────────────

const MB_CLASSES = new Set(["A", "B", "C", "E", "S", "G", "V", "R", "X", "CL", "SL", "M"]);
const MB_NAMED = new Set([
  "CLA", "CLS", "CLK", "CLE", "GLA", "GLB", "GLC", "GLE", "GLS", "GLK", "GL", "ML", "SLK", "SLC", "SLS",
  "EQA", "EQB", "EQC", "EQE", "EQS", "EQV", "EQT", "MAYBACH", "VIANO", "SPRINTER", "VITO", "CITAN", "E-SPRINTER",
]);
const LEXUS_RE = /^(NX|RX|IS|GS|CT|LS|RC|LX|ES|UX|LC|LBX|RZ|LM)(\d{3}[A-Z]{0,2})?(F)?$/;
const MINI_BODIES = ["COUNTRYMAN", "CLUBMAN", "PACEMAN", "CABRIO", "COUPE", "ROADSTER", "ACEMAN"];

type ModelHit = { key: string; consumed: number; motorPrefix?: string; extraRest?: string[] };

function extractModel(make: string, tokens: string[]): ModelHit {
  const [t0, t1] = tokens;
  const aliases = MODEL_ALIASES[make] ?? {};

  if (make === "BMW") {
    let m = t0.match(/^([1-8])(\d{2})(I|D|E|IS|XI|XD|SD|LI|LD|DX|LE|IA|TI|A|XE)?$/);
    if (m) return { key: `${m[1]} SERISI`, consumed: 1, motorPrefix: t0 };
    m = t0.match(/^M([1-8])(\d{2})(I|D|E|LI|IX|DX)$/); // M135I, M340I, M550D
    if (m) return { key: `${m[1]} SERISI`, consumed: 1, motorPrefix: t0 };
    if (t0 === "M" && t1 && /^([1-8])(\d{2})(I|D)$/.test(t1)) return { key: `${t1[0]} SERISI`, consumed: 2, motorPrefix: `M${t1}` };
    if (t0 === "1M") return { key: "1 SERISI", consumed: 1, motorPrefix: "1M" };
    if (t0 === "I3S") return { key: "I3", consumed: 1, motorPrefix: "i3s" };
    if (/^(M[1-8]|X[1-7]M?|Z[34]|I[3-8]|IX[1-3]?|XM)$/.test(t0)) return { key: t0, consumed: 1 };
  }

  if (make === "Mercedes-Benz") {
    let i = 0;
    while (tokens[i] === "MERCEDES-AMG" || tokens[i] === "MERCEDESAMG" || tokens[i] === "MERCEDES") i++;
    const a = tokens[i], b = tokens[i + 1];
    if (!a) return { key: "AMG GT", consumed: i };
    const glued = a.match(/^([A-Z]{1,3})(\d{2,3})([A-Z]*)$/); // "C63", "E63S"
    if (glued && (MB_CLASSES.has(glued[1]) || MB_NAMED.has(glued[1]))) {
      return { key: MB_CLASSES.has(glued[1]) ? `${glued[1]} SERISI` : glued[1], consumed: i + 1, motorPrefix: a };
    }
    if (MB_CLASSES.has(a) && b && /^\d{2,3}[A-Z]*$/.test(b)) {
      return { key: `${a} SERISI`, consumed: i + 2, motorPrefix: `${a} ${b}` };
    }
    if (a === "AMG" && b === "GT") return { key: "AMG GT", consumed: i + 2 };
    if (a === "GT" || a === "AMG") return { key: "AMG GT", consumed: i + 1 };
    if (aliases[`${a} ${b}`]) return { key: aliases[`${a} ${b}`], consumed: i + 2 };
    if (aliases[a]) return { key: aliases[a], consumed: i + 1 };
    if (MB_NAMED.has(a)) {
      if (b && /^\d{2,3}[A-Z]*$/.test(b) && !["SPRINTER", "VITO", "CITAN", "E-SPRINTER"].includes(a)) {
        return { key: a, consumed: i + 2, motorPrefix: `${a} ${b}` };
      }
      return { key: a, consumed: i + 1 };
    }
    if (MB_CLASSES.has(a)) return { key: `${a} SERISI`, consumed: i + 1 };
  }

  if (make === "Lexus") {
    if (/^[A-Z]{2,3}$/.test(t0) && LEXUS_RE.test(t0) && t1 && /^\d{3}[A-Z]{0,2}$/.test(t1)) {
      return { key: t0, consumed: 2, motorPrefix: `${t0}${t1}` }; // "NX 300H"
    }
    const m = t0.match(LEXUS_RE);
    if (m) return { key: m[1], consumed: 1, motorPrefix: m[2] ? t0 : undefined };
    if (LEXUS_RE.test(t0) === false && t1 && LEXUS_RE.test(`${t0}${t1}`)) {
      return { key: t0, consumed: 2, motorPrefix: `${t0}${t1}` }; // "RX 450H"
    }
  }

  if (make === "Mini") {
    // TSB: "COOPER COUNTRYMAN ALL4 ...", "ONE D ...", "COOPER S ..." — model kasa adıdır,
    // ONE/COOPER/COOPER S/JCW motor-paket seviyesidir. Kasa adı yoksa model Cooper (Hatch).
    const idx = tokens.findIndex((t) => MINI_BODIES.includes(t));
    if (idx >= 0) {
      return { key: tokens[idx], consumed: 0, extraRest: tokens.filter((_, j) => j !== idx) };
    }
    return { key: "COOPER", consumed: 0, extraRest: tokens };
  }

  const multi = (MULTI_WORD_MODELS[make] ?? []).slice().sort((x, y) => y.length - x.length);
  const joined = tokens.join(" ");
  for (const mw of multi) {
    if (joined === mw || joined.startsWith(mw + " ")) return { key: aliases[mw] ?? mw, consumed: mw.split(" ").length };
  }
  if (aliases[t0]) return { key: aliases[t0], consumed: 1 };
  // Marka adı + numara: "JAECOO 7", "OMODA 5"
  if (t0 === fold(make) && t1 && /^\d{1,2}[A-Z]?$/.test(t1)) return { key: `${t0} ${t1}`, consumed: 2 };
  if (make === "Volkswagen" && t0 === "THE" && t1) return { key: t1, consumed: 2 }; // "THE BEETLE"
  // "CROSS CADDY", "CROSS POLO": Cross bir donanım paketidir, model sonraki kelime
  if (make === "Volkswagen" && t0 === "CROSS" && t1) return { key: aliases[t1] ?? t1, consumed: 0, extraRest: ["CROSS", ...tokens.slice(2)] };
  if (make === "Lada" && t0 === "LADA" && t1) return { key: `LADA ${t1}`, consumed: 2 };
  if (/^[A-Z]$/.test(t0) && t1) return { key: `${t0} ${t1}`, consumed: 2 }; // "F 150"
  return { key: t0, consumed: 1 };
}

// ─── Ana ayrıştırıcı ──────────────────────────────────────────────────────

/**
 * @param rakamliModeller build.ts'in TSB verisinden çıkardığı "MARKA|İLK RAKAM" kümesi:
 *   bir modelin TÜM satırlarında adın ardından tek rakam geliyorsa ve en az iki farklı
 *   rakam varsa, rakam model adının parçasıdır (ATTO 2 / ATTO 3, TIGGO 7 / TIGGO 8).
 */
export function parseTip(tsbMarka: string, tipAdi: string, deglue?: Deglue, rakamliModeller?: Set<string>): ParseResult {
  if (EXCLUDED_BRANDS.has(tsbMarka)) return { ok: false, neden: "kapsam-disi-marka" };

  const duzeltmeler: string[] = [];
  let text = fold(tipAdi)
    .replace(/\\/g, " ")
    // TSB parantez içinde yalnızca beygir yazar: "(102)" → "102HP"
    .replace(/\(\s*(\d{2,4})\s*\)/g, " $1HP ")
    .replace(/[()]/g, " ")
    .replace(/(\d),(\d)/g, "$1.$2")
    .replace(/,/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  let tokens: string[] = [];
  for (const raw of text.split(" ")) {
    if (TYPO_FIXES[raw]) {
      duzeltmeler.push(`${raw}→${TYPO_FIXES[raw]}`);
      tokens.push(...TYPO_FIXES[raw].split(" "));
      continue;
    }
    const parts = DEGLUE_EXCEPTIONS.has(raw) ? null : deglue?.(raw);
    if (parts) { duzeltmeler.push(`${raw}→${parts.join(" ")}`); tokens.push(...parts); } else tokens.push(raw);
  }
  // İki kelimelik otomatik vites yazımlarını tek kelimeye indir ("S TRONIC" → "S-TRONIC")
  for (let i = 0; i < tokens.length - 1; i++) {
    if (AUTO_TWO_WORDS.has(`${tokens[i]} ${tokens[i + 1]}`)) { tokens.splice(i, 2, "OTOMATIK"); }
  }
  text = tokens
    .join(" ")
    // Yapışık hacim+motor(+güç): "1.5TFSI150" → "1.5 TFSI 150", "1.0MHEV" → "1.0 MHEV"
    .replace(/\b(\d\.\d{1,2})([A-Z][A-Z-]{1,9})(\d{2,3})?\b/g, (m, d, e, p) =>
      ENGINE_WORDS[e] ? [d, e, p].filter(Boolean).join(" ") : m)
    // Yapışık güç+vites: "125AT" → "125 AT"
    .replace(/\b(\d{2,3})(AT\d?|DCT|CVT|MT\d?)\b/g, "$1 $2")
    .replace(/\bEURO ([3456])\b/g, "EURO$1")
    .replace(/\bBLUE HDI\b/g, "BLUEHDI")
    .replace(/\bT FSI\b/g, "TFSI");
  if (tsbMarka === "FORD") text = text.replace(/\b([2-4]\d0) ([LSM])\b/g, "$1$2");
  if (tsbMarka.includes("IVECO")) text = text.replace(/\b(\d{2}) ?([CS]) ?(\d{2})\b/g, "$1$2$3");
  // Bölme/ayırma sonrası ortaya çıkan parçalarda da yazım hatası olabilir ("…1.5BLUHDI" → "BLUHDI")
  tokens = text.split(" ").flatMap((w) => {
    if (!TYPO_FIXES[w]) return [w];
    duzeltmeler.push(`${w}→${TYPO_FIXES[w]}`);
    return TYPO_FIXES[w].split(" ");
  });
  text = tokens.join(" ");
  if (HEAVY_RE.test(text)) return { ok: false, neden: "agir-vasita" };

  let make = BRAND_MAP[tsbMarka] ?? titleCase(fold(tsbMarka));
  const sub = SUB_BRANDS[tsbMarka]?.[tokens[0]];
  if (sub) { make = sub.make; if (!sub.keep) tokens = tokens.slice(1); }
  while (tokens.length > 1 && START_NOISE_RE.test(tokens[0])) tokens = tokens.slice(1);
  const makeFold = fold(make);
  if (tokens[0] === makeFold && tokens.length > 1 && !/^\d/.test(tokens[1]) && make !== "Mini") tokens = tokens.slice(1);
  if (make === "Mini" && tokens[0] === "MINI") tokens = tokens.slice(1);
  // TSB "RANGE ROVER" markası altında model adı çoğu zaman yazılmıyor ("3.0 SDV6 VOGUE")
  if (tsbMarka === "RANGE ROVER" && tokens[0] !== "RANGE") tokens = ["RANGE", "ROVER", ...tokens];
  if (!tokens.length) return { ok: false, neden: "bos-tip" };

  const hit = rakamliModeller?.has(`${tsbMarka}|${tokens[0]} ${tokens[1]}`)
    ? { key: `${tokens[0]} ${tokens[1]}`, consumed: 2 } as ModelHit
    : extractModel(make, tokens);
  const rest = hit.extraRest ?? tokens.slice(hit.consumed);
  let nesil: string | null = null;
  if (rest.length > 1 && /^(II|III|IV|VI|VII|VIII)$/.test(rest[0]) && !/^(KAPI|KOLTUK\w*|KISI\w*)$/.test(rest[1])) {
    nesil = rest.shift()!;
  }
  const uyarilar: string[] = [];

  // Kategori
  const category: ParsedTip["category"] =
    LCV_WORDS_RE.test(rest.join(" ")) ||
    // Rakamlı alt modeller de ana modelin kategorisini alır ("DELIVER 7" → DELIVER)
    // (yalnız "<model> <rakam>" — "TRANSIT CONNECT" gibi ayrı modeller TRANSIT'e dahil DEĞİL)
    (LCV_MODELS[make] ?? []).some((k) => hit.key === k || new RegExp(`^${k.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} \\d$`).test(hit.key))
      ? "kamyonet" : "otomobil";

  // Parçalar
  let body: string | null = null, cekis: string | null = null, vites: Vites | null = null;
  let vitesTuru: VitesTuru | null = null;
  let hp: number | null = null, kw: number | null = null, bataryaKwh: number | null = null;
  const config: string[] = [];
  const bmwKod = (k: string) => k.replace(/^(M?\d{2,3})(L?)([A-Z]*)$/, (_, n, l, s) => n + l + s.toLowerCase());
  const lexusKod = (k: string) => k.replace(/^([A-Z]+\d{3})([A-Z]*)$/, (_, a, s) => a + s.toLowerCase()); // NX300H → NX300h
  const motorParts: string[] = hit.motorPrefix
    ? [make === "BMW" ? bmwKod(hit.motorPrefix) : make === "Lexus" ? lexusKod(hit.motorPrefix) : titleWord(hit.motorPrefix)]
    : [];
  const paketParts: string[] = [];
  const vitessiz: string[] = [];
  let motorSeen = motorParts.length > 0;
  let hacimVar = false;

  for (let i = 0; i < rest.length; i++) {
    const w = rest[i];
    const next = rest[i + 1] ?? "";
    const two = next ? `${w} ${next}` : "";

    if (AUTO_RE.test(w) || CVT_RE.test(w) || AMT_RE.test(w)) {
      vites = "AUTOMATIC";
      vitesTuru = CVT_RE.test(w) ? "CVT" : AMT_RE.test(w) ? "Yarı Otomatik" : (vitesTuru ?? "Otomatik");
      continue;
    }
    if (MANUAL_RE.test(w)) { vites ??= "MANUAL"; continue; }
    if (NOISE_RE.test(w)) continue;
    vitessiz.push(w);

    if (two && BODY_WORDS[two]) { body ??= BODY_WORDS[two]; vitessiz.push(next); i++; continue; }
    if (two && DRIVE_WORDS[two]) { cekis ??= DRIVE_WORDS[two]; vitessiz.push(next); i++; continue; }
    if (two && ENGINE_WORDS[two]) { motorParts.push(ENGINE_WORDS[two]); motorSeen = true; vitessiz.push(next); i++; continue; }
    // "4D" yalnız Honda Civic/City'de gövde önekiyken ("4D DREAM...") sedan işaretidir;
    // aynı token SEAT Ateca'da (SUV) ve "D-4D" dizel motor kodunun parçası olarak
    // Toyota'da ("... D 4D") da geçtiğinden, yalnız kalan metnin İLK kelimesiyse güvenilir.
    if (w === "4D" && i === 0) { body ??= "Sedan"; continue; }
    if (BODY_WORDS[w]) { body ??= BODY_WORDS[w]; continue; }
    if (DRIVE_WORDS[w]) { cekis ??= DRIVE_WORDS[w]; continue; }
    if (/^(XDRIVE|SDRIVE)\d{2}[IDE]?$/.test(w)) { // "SDRIVE18I" → çekiş + motor
      cekis ??= w.startsWith("X") ? "xDrive" : "sDrive";
      motorParts.push(w.replace(/^XDRIVE/, "xDrive").replace(/^SDRIVE/, "sDrive").replace(/([IDE])$/, (c) => c.toLowerCase()));
      motorSeen = true; continue;
    }

    // Audi güç sınıfı kodu: "40 TDI", "55 TFSI E" — motor bilgisidir
    if (make === "Audi" && /^[2-7][05]$/.test(w) && /^(TFSI|TDI|TSI|E-TRON|\d\.\d)/.test(next)) { motorParts.push(w); motorSeen = true; continue; }
    if (make === "Audi" && w === "E" && /TFSI|TDI/.test(rest[i - 1] ?? "")) { motorParts.push("e"); continue; }
    // 3 haneli ticari kodu + motor ailesi: "114 CDI", "316 CDI"
    if (category === "kamyonet" && /^\d{3}$/.test(w) && ENGINE_WORDS[next]) { motorParts.push(w); motorSeen = true; continue; }
    // BMW: "SDRIVE 18I" / "XDRIVE 30D" ayrık yazımı — sayı+harf motor kodudur
    if (make === "BMW" && /^\d{2}[IDE]$/.test(w) && /^(XDRIVE|SDRIVE)$/.test(rest[i - 1] ?? "")) {
      motorParts.push(w.slice(0, 2) + w[2].toLowerCase()); motorSeen = true; continue;
    }

    // Hafif ticari ağırlık/güç kodu: "SPRINTER 316", "TRANSIT 350L"
    if (!motorSeen && LCV_CODE_RE_BY_MODEL[hit.key]?.test(w) && !paketParts.length) { motorParts.push(w); motorSeen = true; continue; }

    // Koltuk: "7 KOLTUKLU" / "7K"
    if (/^\d{1,2}$/.test(w) && /^(KOLTUK|KOLTUKLU|KISI|KISILIK)$/.test(next)) { config.push(`${w} Koltuklu`); i++; continue; }
    if (/^[5-9]K$/.test(w)) { config.push(`${w[0]} Koltuklu`); continue; }
    if (category === "kamyonet" && CONFIG_RE.test(w)) { config.push(titleWord(w)); continue; }

    // Batarya / güç
    let m = w.match(/^(\d+(?:\.\d+)?)KWH$/);
    if (m) { bataryaKwh = Number(m[1]); continue; }
    if (/^\d+(\.\d+)?$/.test(w) && next === "KWH") { bataryaKwh = Number(w); i++; continue; }
    m = w.match(/^(\d{2,4})KW$/);
    if (m && next !== "OBC") { kw ??= Number(m[1]); continue; }
    if (/^\d{2,4}$/.test(w) && next === "KW") { kw ??= Number(w); i++; continue; }
    if (/^\d+(\.\d+)?KW$/.test(w) && next === "OBC") { i++; continue; } // şarj cihazı gücü
    m = w.match(/^(\d{2,4})(HP|PS|BG|CV)$/);
    if (m) { hp ??= Number(m[1]); continue; }
    if (/^\d{2,4}$/.test(w) && /^(HP|PS|BG|CV)$/.test(next)) { hp ??= Number(w); i++; continue; }

    // Motor: hacim, aile kelimeleri, kodlar. Tek başına "D" dizel işaretidir ("E 200 D", "ONE D").
    if (w === "D") { motorParts.push("d"); motorSeen = true; continue; }
    if (w === "T" && /^\d\.\d/.test(rest[i - 1] ?? "")) { motorParts.push("T"); continue; }
    if (/^\d\.\d{1,2}[A-Z]{0,2}$/.test(w)) { motorParts.push(titleWord(w)); motorSeen = true; hacimVar = true; continue; }
    if (ENGINE_WORDS[w]) { motorParts.push(ENGINE_WORDS[w]); motorSeen = true; continue; }
    if (ENGINE_CODE_RE.test(w) || ((make === "Volvo" || make === "Polestar") && VOLVO_CODE_RE.test(w))) {
      motorParts.push(w); motorSeen = true; continue;
    }

    // Çıplak sayı: beygir (motor bilgisinden sonra, 40-1500 arası)
    if (/^\d{2,4}$/.test(w)) {
      const n = Number(w);
      if (hp === null && n >= 40 && n <= 1500 && motorSeen) { hp = n; continue; }
      if (hp === null && category === "kamyonet" && n >= 70 && n <= 250) { hp = n; continue; }
    }
    paketParts.push(w);
  }

  // Yakıt: önce modelin kendisi, sonra tip adındaki işaretler (model adı hariç)
  let yakit: Yakit | null = null;
  let yakitKaynak: AlanKaynagi = null;
  if ((EV_ONLY_MODELS[make] ?? []).includes(hit.key)) { yakit = "EV"; yakitKaynak = "kural-model"; }
  else {
    const fuelText = [hit.motorPrefix ?? "", ...rest].join(" ").trim();
    if (make === "BMW" && hit.motorPrefix && /\d{2}L?X?E$/.test(hit.motorPrefix)) yakit = "PHEV";
    else if (make === "Mercedes-Benz" && hit.motorPrefix && (rest[0] === "E" || rest[0] === "DE")) yakit = "PHEV";
    else if (make === "Mercedes-Benz" && hit.motorPrefix && rest[0] === "H") yakit = "HYBRID";
    else if (/\bM\d{2,3}D\b/.test(fuelText)) yakit = "DIESEL";
    // Lexus kod soneki: h = hibrit, h+ = plug-in, t = turbo benzinli, e = elektrikli
    else if (make === "Lexus" && hit.motorPrefix && /\d{3}(H\+|H|T|E)$/.test(hit.motorPrefix)) {
      const s = hit.motorPrefix.match(/\d{3}(H\+|H|T|E)$/)![1];
      yakit = s === "H+" ? "PHEV" : s === "H" ? "HYBRID" : s === "T" ? "GASOLINE" : "EV";
    }
    else if ((make === "Volvo" || make === "Polestar") && !/HYBRID|RECHARGE|TWIN ENGINE|ELECTRIC|KWH/.test(fuelText) && rest.some((w) => /^[DT][2-8]$/.test(w))) {
      yakit = rest.some((w) => /^D[2-5]$/.test(w)) ? "DIESEL" : "GASOLINE";
    }
    else for (const [f, re] of FUEL_RULES) if (re.test(fuelText)) { yakit = f as Yakit; break; }
    // Çelişki koruması: aynı satırda hem dizel hem benzin işareti varsa motor ailesi adı
    // (güçlü işaret) karar verir; ikisi de güçlüyse ya da ikisi de zayıfsa tahmin yok.
    if (yakit === "DIESEL" && FUEL_RULES.find(([f]) => f === "GASOLINE")![1].test(fuelText)) {
      const gD = GUCLU_DIZEL_RE.test(fuelText), gB = GUCLU_BENZIN_RE.test(fuelText);
      yakit = /\b(DIZEL|DIESEL|DZL)\b/.test(fuelText) ? "DIESEL"
        : /\bBENZIN/.test(fuelText) ? "GASOLINE"
        : gD && !gB ? "DIESEL" : gB && !gD ? "GASOLINE" : null;
      if (yakit === null) uyarilar.push("yakit-celiskisi");
    }
    if (yakit) yakitKaynak = "tsb";
    // Adlandırma kuralı (yalnız binek): hacim/motor kodu yazıyor, yakıt işareti yok → benzinli
    else if (
      !uyarilar.includes("yakit-celiskisi") &&
      category === "otomobil" &&
      (hacimVar || (make === "Mercedes-Benz" && hit.motorPrefix)) &&
      // Volvo "B4/B5" hem benzinli hem dizel mild-hybrid olabiliyor — kural uygulanmaz
      !((make === "Volvo" || make === "Polestar") && rest.some((w) => /^B[3-6]$/.test(w)))
    ) {
      yakit = "GASOLINE"; yakitKaynak = "kural-adlandirma";
    }
  }

  let vitesKaynak: AlanKaynagi = vites ? "tsb" : null;
  if (vites === null && yakit === "EV") { vites = "AUTOMATIC"; vitesKaynak = "kural-ev"; }
  if (vites === "MANUAL") vitesTuru = "Manuel";
  else if (vites === "AUTOMATIC") vitesTuru ??= "Otomatik";
  if (hp === null && kw !== null) hp = Math.round(kw * 1.35962);
  // Parantez içi sayı normalde beygirdir ("i3 (170)") ama kaynakta en az bir
  // satırda (Dodge Challenger/Charger SRT8 "(6400)") bariz motor hacmi/kod
  // gibi görünüyor, beygir değil — imkânsız değeri tahmin etmek yerine at.
  if (hp !== null && (hp < 40 || hp > 1500)) { hp = null; uyarilar.push("beygir-supheli"); }
  // Elektrikli araçlarda motor genelde hacimle değil kW/kWh ile anılıyor — bu
  // bilgi beygire çevrilse bile versiyon metni boş kalmasın diye burada da yazılır
  // (ör. "170 kW" · 231 HP). Sadece parantezden gelen çıplak beygirde (kW/kWh
  // yoksa) tekrarı önlemek için "Elektrik" gibi jenerik bir söz konur.
  if (!motorParts.length && kw !== null) motorParts.push(`${kw} kW`);
  else if (!motorParts.length && bataryaKwh !== null) motorParts.push(`${bataryaKwh} kWh`);
  else if (!motorParts.length && hp !== null && (yakit === "EV" || yakit === "HYBRID" || yakit === "PHEV")) {
    motorParts.push(yakit === "EV" ? "Elektrik" : yakit === "PHEV" ? "Plug-in Hibrit" : "Hibrit");
  }
  if (hp === null) uyarilar.push("beygir-yok");
  if (!motorParts.length) uyarilar.push("motor-yok");
  if (hit.key.length > 14 && !hit.key.includes(" ")) uyarilar.push("model-supheli");

  const kasa = [body, ...config].filter(Boolean).join(" · ") || null;
  const paketRaw = paketParts.join(" ").replace(/^[-+./]+|[-+./]+$/g, "").trim();

  return {
    ok: true,
    value: {
      make,
      category,
      modelKey: hit.key,
      model: displayModel(hit.key),
      kasa,
      motor: motorParts.length ? motorParts.join(" ") : null,
      hp, kw, bataryaKwh, cekis,
      paket: paketRaw ? titleCase(paketRaw) : null,
      nesil,
      yakit, yakitKaynak, vites, vitesKaynak, vitesTuru,
      vitessizAnahtar: `${make}|${hit.key}|${vitessiz.join(" ")}`,
      duzeltmeler,
      uyarilar,
    },
  };
}
