// sahibinden.com ilan sayfası Cloudflare bot koruması arkasında olduğu için
// otomatik erişilemiyor (bkz. proje notları). Bunun yerine admin ilanı kendi
// tarayıcısında açıp "Teknik Özellikler" bölümünün HTML'ini kopyalayıp
// yapıştırıyor — bu fonksiyon o HTML'i SPEC_FIELDS şemasına eşler.
// Kaynak admin'in zaten güvendiği/doğruladığı bir ilan olduğu için (Wikipedia/
// CarQuery tahmininin aksine) eşlenen alanlara doğrudan "high" güven veriliyor.

function stripHtml(s: string): string {
  return s
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Türkçe binlik nokta ayracını (1.940 → 1940) ondalık noktadan (8.9 → 8.9)
// ayırt eder — vehicleSpecs.ts'teki extractNumber ile aynı mantık.
function extractNumber(raw: string): string | null {
  const cleaned = raw.replace(/(\d)\.(\d{3})\b/g, "$1$2");
  const m = cleaned.match(/\d+\.?\d*/);
  return m ? m[0] : null;
}

function extractPairs(html: string): { title: string; value: string }[] {
  const rows = [...html.matchAll(/<tr[^>]*>([\s\S]*?)<\/tr>/gi)];
  const pairs: { title: string; value: string }[] = [];
  for (const row of rows) {
    const titleMatch = row[1].match(/<td[^>]*class="title"[^>]*>([\s\S]*?)<\/td>/i);
    const valueMatch = row[1].match(/<td[^>]*class="value"[^>]*>([\s\S]*?)<\/td>/i);
    if (!titleMatch || !valueMatch) continue;
    const title = stripHtml(titleMatch[1]);
    const value = stripHtml(valueMatch[1]);
    if (title && value) pairs.push({ title, value });
  }
  return pairs;
}

function mapBodyType(value: string): string | null {
  const l = value.toLowerCase();
  if (l.includes("suv")) return "suv";
  if (l.includes("hatchback")) return "hatchback";
  if (l.includes("sedan")) return "sedan";
  if (l.includes("station") || l.includes("wagon")) return "station";
  if (l.includes("mpv")) return "mpv";
  if (l.includes("coupe")) return "coupe";
  if (l.includes("cabrio") || l.includes("roadster")) return "cabrio";
  if (l.includes("pickup")) return "pickup";
  if (l.includes("van") || l.includes("minivan") || l.includes("panelvan")) return "van";
  return null;
}

function mapTransmission(value: string): string | null {
  const l = value.toLowerCase();
  if (l.includes("yarı otomatik")) return "Yarı Otomatik";
  if (l.includes("cvt")) return "CVT";
  if (l.includes("otomatik")) return "Otomatik";
  if (l.includes("manuel") || l.includes("düz")) return "Manuel";
  return null;
}

function mapDrivetrain(value: string): string | null {
  const l = value.toLowerCase();
  if (l.includes("önden")) return "FWD";
  if (l.includes("arkadan")) return "RWD";
  if (l.includes("4 çeker") || l.includes("dört çeker") || l.includes("4x4") || l.includes("awd")) return "AWD";
  return null;
}

export function parseSahibindenSpecs(html: string): Record<string, string> {
  const specs: Record<string, string> = {};

  for (const { title, value } of extractPairs(html)) {
    const t = title.toLowerCase();

    if (t.includes("segment")) {
      const m = value.match(/^([A-F])\b/i);
      if (m) specs.segment = m[1].toUpperCase();
    } else if (t.includes("kasa tipi")) {
      const bt = mapBodyType(value.split("/")[0]);
      if (bt) specs.body_type = bt;
    } else if (t.includes("şanzıman") || (t.includes("vites") && t.includes("çekiş"))) {
      for (const part of value.split("/").map((p) => p.trim())) {
        const tr = mapTransmission(part);
        if (tr) specs.transmission = tr;
        const dr = mapDrivetrain(part);
        if (dr) specs.drivetrain = dr;
      }
    } else if (t.includes("motor gücü") || t.includes("maksimum güç")) {
      const n = extractNumber(value);
      if (n) specs.power_hp = String(Math.round(parseFloat(n)));
    } else if (t.includes("motor hacmi")) {
      const n = extractNumber(value);
      if (n) specs.engine_cc = String(Math.round(parseFloat(n)));
    } else if (t.includes("tork")) {
      // "Maksimum Tork" (İçten yanmalı) veya sadece "Tork" (elektrikli) — ikisi de aynı alana gider
      const n = extractNumber(value);
      if (n) specs.torque_nm = String(Math.round(parseFloat(n)));
    } else if (t.includes("hızlanma")) {
      const n = extractNumber(value);
      if (n) specs.zero_to_100 = n;
    } else if (t.includes("azami sürat")) {
      const n = extractNumber(value);
      if (n) specs.top_speed_kmh = n;
    } else if (t.includes("yakıt depo")) {
      const n = extractNumber(value);
      if (n) specs.tank_l = n;
    } else if (t.includes("net ağırlık")) {
      const n = extractNumber(value);
      if (n) specs.weight_kg = n;
    } else if (t.includes("bagaj")) {
      const n = extractNumber(value);
      if (n) specs.boot_l = n;
    } else if (t === "menzil") {
      // Tam eşleşme şart — "Şarj Süresi" gibi başlıklar da "süre/menzil" gibi
      // kelimeler içerebiliyor, yanlışlıkla eşleşmesin
      const n = extractNumber(value);
      if (n) specs.ev_range_km = n;
    }
  }

  return specs;
}
