// Araç öneri onayında teknik özellikleri otomatik ilk-tahminle dolduran katman.
// ESKİ yaklaşım (CarQuery API + Wikipedia HTML parse) sadece otomobil için
// anlamlıydı ve gerçek ölçümde 497 üründen 2'sinde veri buluyordu (CarQuery
// kalıcı erişilemez durumda) — bkz. proje notları. Bunun yerine Gemini'den
// (aynı ücretsiz katman, AI Araç Özeti'nde kullanılan) yapılandırılmış JSON
// isteniyor; artık 6 kategorinin tamamı için çalışıyor.
//
// KRİTİK KISIT: Gemini'nin canlı Google araması (Grounding) burada da
// KULLANILMIYOR — o özelliğin ToS'u "sadece isteği yapana göster, önbellekleme"
// şartı koşuyor, biz DB'ye kalıcı yazıyoruz. Yani model SADECE eğitim
// verisinden cevap veriyor: popüler/global modellerin nesil-seviyesi temel
// bilgisinde (motor, güç, kasa) makul, Türkiye'ye özel paket/trim ince
// detaylarında ve niş markalarda halüsinasyon riski var. Bu yüzden:
// - Sonuç ASLA "high" güvene çıkmaz (tavan "medium") — kritik alanlarda admin
//   onayı zorunluluğu (bkz. specFields.ts CRITICAL_FIELDS) aynen korunuyor.
// - Aynı prompt'la 2 BAĞIMSIZ çağrı yapılır; ikisi örtüşürse "medium", çelişirse
//   "low"+conflict, tek çağrı cevap verirse "low". (Aynı modele iki kez sormak
//   CarQuery+Wikipedia gibi gerçekten bağımsız iki kaynak değil — o yüzden
//   örtüşme bile "high" garantisi vermiyor, sadece "tutarlı" demek.)
// - Aralık dışı değerler (REASONABLE_RANGES) hiç yazılmaz — susmuş boşluk,
//   yanlış değerden iyidir (bkz. proje felsefesi, [[fikape-oner-akisi-guclendirme]]).
//
// İlan HTML'inden doldur (listingSpecParse.ts) BU KATMANDAN AYRI ve
// DOKUNULMADI — admin'in zaten doğruladığı tek "high" güven kaynağı odur.

import { generateGeminiJson, GeminiError } from "@/lib/ai/gemini";
import { SPEC_FIELDS, type FieldDef } from "@/lib/specFields";
import { FUEL_LABELS } from "@/lib/fuel";

function norm(s: string) {
  return (s ?? "")
    .toLowerCase()
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]/g, "");
}

// ── Güven skorlaması ─────────────────────────────────────────────────────────
export type SpecConfidence = "high" | "medium" | "low";
export interface SpecFieldMeta {
  value: string;
  confidence: SpecConfidence;
  source: string;
  conflictWith?: { source: string; value: string };
}
export type SpecFieldMap = Record<string, SpecFieldMeta>;

// Alan başına makul değer aralığı — dışındaki değerler veri hatası kabul
// edilip HİÇ yazılmaz. Sadece sayısal alanlar için; tanımı olmayan sayısal
// alanlarda (örn. karavan boyutları) bu kontrol atlanır (reddetmez).
const REASONABLE_RANGES: Record<string, [number, number]> = {
  engine_cc:        [600, 8000],
  power_hp:         [40, 800],
  torque_nm:        [50, 1200],
  zero_to_100:      [2, 25],
  top_speed_kmh:    [80, 350],
  max_speed_kmh:    [10, 250],
  tank_l:           [20, 150],
  weight_kg:        [700, 4000],
  boot_l:           [50, 2000],
  battery_kwh:      [10, 200],
  ev_range_km:      [50, 800],
  motor_watt:       [100, 15000],
  range_km:         [5, 500],
  battery_wh:       [100, 3000],
  seat_height_mm:   [600, 950],
  gearbox:          [1, 8],
  berth:            [1, 8],
  length_cm:        [300, 1200],
  width_cm:         [150, 300],
  height_cm:        [150, 250],
  exterior_height_cm: [200, 400],
  empty_weight_kg:  [500, 6000],
  total_weight_kg:  [700, 7500],
  tow_weight_kg:    [500, 5000],
  water_tank_l:     [10, 500],
  waste_water_tank_l: [10, 500],
  payload_kg:       [200, 5000],
  tow_capacity_kg:  [200, 5000],
  max_load_kg:      [50, 200],
  tire_inch:        [6, 14],
  charge_hours:     [0.5, 24],
  seat_count:       [1, 9],
};

function inReasonableRange(key: string, raw: string): boolean {
  const range = REASONABLE_RANGES[key];
  if (!range) return true;
  const n = parseFloat(raw);
  if (Number.isNaN(n)) return false;
  return n >= range[0] && n <= range[1];
}

function valuesAgree(field: FieldDef, a: string, b: string): boolean {
  if (field.type === "number") {
    const na = parseFloat(a), nb = parseFloat(b);
    if (Number.isNaN(na) || Number.isNaN(nb)) return false;
    return Math.abs(na - nb) / Math.max(na, nb) <= 0.05; // ±%5 tolerans
  }
  return norm(a) === norm(b);
}

// ── Gemini'den istenecek alan listesini prompt metnine çevir ────────────────

const CATEGORY_LABELS: Record<string, string> = {
  otomobil: "Otomobil", motosiklet: "Motosiklet", "e-scooter": "E-Scooter",
  "e-bisiklet": "E-Bisiklet", karavan: "Karavan", kamyonet: "Kamyonet",
};

function describeField(f: FieldDef): string {
  if (f.type === "number") return `- ${f.key}: sayı${f.unit ? ` (${f.unit})` : ""}, emin değilsen null`;
  if (f.type === "boolean") return `- ${f.key}: true veya false, emin değilsen null`;
  if (f.type === "select") {
    const opts = f.options.map((o) => o.value).join(", ");
    return `- ${f.key}: SADECE şu değerlerden biri (aynen yaz): ${opts} — emin değilsen null`;
  }
  return `- ${f.key}: kısa serbest metin, emin değilsen null`;
}

function relevantFields(categorySlug: string, fuelType: string | null): FieldDef[] {
  const all = SPEC_FIELDS[categorySlug] ?? [];
  const ctxAttrs = { fuel_type: fuelType ?? "" };
  // showIf sadece fuel_type'a bağlı olanlar için filtrelenir — diğer alana
  // bağlı olanlar (örn. body_type'a bağlı kabin tipi) henüz bilinmediği için
  // olduğu gibi sorulur, zararsız (form katmanı zaten showIf'e göre gizliyor).
  return all.filter((f) => !f.showIf || f.showIf(ctxAttrs));
}

function buildPrompt(
  brand: string, model: string, year: number | null, trimHint: string | null,
  categorySlug: string, fuelType: string | null, fields: FieldDef[],
): string {
  const vehicleLine = [
    brand, model, year ? String(year) : null, trimHint,
    fuelType ? FUEL_LABELS[fuelType] ?? fuelType : null,
  ].filter(Boolean).join(" ");

  return `Sen bir araç teknik özellikleri uzmanısın. Aşağıdaki araç için istenen teknik özellik alanlarını doldur.

Araç: ${vehicleLine}
Kategori: ${CATEGORY_LABELS[categorySlug] ?? categorySlug}

KURALLAR:
- Cevabın SADECE geçerli bir JSON nesnesi olsun, başka hiçbir metin ekleme.
- Her alan için ya değeri ya da null yaz. UYDURMA — emin olmadığın, tahmin ettiğin
  ya da genel/ortalama bir sayı vereceğin her alanı null bırak.
- Değerler bu aracın GENEL/NESİL seviyesindeki (Türkiye'ye özel paket/donanım
  adının ince ayrıntıları değil) teknik özellikleri olmalı — donanım paketi
  isimlerine (ör. "Shine", "Elite", "Icon") göre değişen ince farkları bilmiyorsan
  null bırak, genel nesil değerini de verme.
- Sayısal alanlar birim/etiket İÇERMEDEN sade sayı olarak yazılsın (ör. "1598", "1.6" değil "1600").

İstenen alanlar:
${fields.map(describeField).join("\n")}

JSON formatı: { "alan_adı": "değer_veya_null", ... } — yukarıdaki TÜM alan adlarını anahtar olarak kullan.`;
}

// ── Gemini yanıtını doğrula ve tanımlı alan şemasına eşle ───────────────────

function validateGeminiResponse(raw: unknown, fields: FieldDef[]): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== "object") return out;
  const obj = raw as Record<string, unknown>;

  for (const f of fields) {
    const v = obj[f.key];
    if (v == null) continue;
    const s = String(v).trim();
    if (!s || s.toLowerCase() === "null") continue;

    if (f.type === "number") {
      const n = parseFloat(s.replace(",", "."));
      if (Number.isNaN(n)) continue;
      if (!inReasonableRange(f.key, String(n))) continue;
      out[f.key] = String(n);
    } else if (f.type === "boolean") {
      const l = s.toLowerCase();
      if (l !== "true" && l !== "false") continue;
      out[f.key] = l;
    } else if (f.type === "select") {
      const match = f.options.find((o) => o.value === s || norm(o.value) === norm(s));
      if (!match) continue;
      out[f.key] = match.value;
    } else {
      out[f.key] = s.slice(0, 40);
    }
  }
  return out;
}

async function fetchGeminiSpecsOnce(prompt: string, fields: FieldDef[]): Promise<Record<string, string>> {
  try {
    const raw = await generateGeminiJson(prompt);
    return validateGeminiResponse(raw, fields);
  } catch (e) {
    if (e instanceof GeminiError) return {};
    throw e;
  }
}

// ── Herkese açık API ──────────────────────────────────────────────────────────
// /api/admin/fetch-specs tarafından kullanılır (bkz. o route). Aynı prompt'la
// iki BAĞIMSIZ çağrı yapılıp sonuçlar karşılaştırılır.
export async function fetchVehicleSpecsWithConfidence(
  brand: string, model: string, year: number | null, trimHint: string | null,
  categorySlug: string, fuelType: string | null,
): Promise<{ specs: SpecFieldMap }> {
  const fields = relevantFields(categorySlug, fuelType);
  if (fields.length === 0) return { specs: {} };

  const prompt = buildPrompt(brand, model, year, trimHint, categorySlug, fuelType, fields);
  const [a, b] = await Promise.all([
    fetchGeminiSpecsOnce(prompt, fields),
    fetchGeminiSpecsOnce(prompt, fields),
  ]);

  const fieldByKey = new Map(fields.map((f) => [f.key, f]));
  const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
  const result: SpecFieldMap = {};

  for (const key of keys) {
    const field = fieldByKey.get(key);
    if (!field) continue;
    const va = a[key], vb = b[key];

    let meta: SpecFieldMeta;
    if (va && vb) {
      if (valuesAgree(field, va, vb)) {
        meta = { value: va, confidence: "medium", source: "gemini_x2" };
      } else {
        meta = { value: va, confidence: "low", source: "gemini", conflictWith: { source: "gemini", value: vb } };
      }
    } else {
      meta = { value: (va ?? vb)!, confidence: "low", source: "gemini" };
    }

    result[key] = meta;
  }

  return { specs: result };
}
