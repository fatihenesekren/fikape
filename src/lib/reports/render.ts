import { BASE_URL } from "@/lib/baseUrl";
import { FI, REPORT_LOGO, CELL, CELL_NUM, TH, H2 } from "./theme";
import { delta, fmtInt } from "./format";
import type { WeeklyReportData, ReportSection, Cell, Kpi } from "./collect";

// E-posta HTML'i: yalnızca tablo, her hücre inline stil, 600px, base64 görsel yok.
// Gmail ~102KB'de kırpar → stiller theme.ts'te kısa sabitler; satırlar sınırlı;
// kişiye bağlı her şey /admin linki.

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

function deltaSpan(d: NonNullable<Cell["delta"]>): string {
  const color = d.color === "up" ? FI.up : d.color === "down" ? FI.down : FI.flat;
  return `<span style="font-family:Arial,sans-serif;font-size:12px;font-weight:700;color:${color};white-space:nowrap">${esc(d.text)}</span>`;
}

function cellHtml(c: Cell, isHeadCol: boolean): string {
  const align = c.align === "r" || c.delta ? "right" : "left";
  const inner = c.delta ? deltaSpan(c.delta) : esc(c.t);
  const style = c.delta ? CELL : c.align === "r" ? CELL_NUM : CELL;
  return `<td align="${align}" style="${style}">${isHeadCol ? `<strong>${inner}</strong>` : inner}</td>`;
}

function sectionHtml(s: ReportSection): string {
  const heading = `<tr><td style="${H2}">${esc(s.title)}</td></tr>`;
  const note = s.note
    ? `<tr><td style="padding:0 24px 6px;font-family:Arial,sans-serif;font-size:11px;color:${FI.muted}">${esc(s.note)}</td></tr>`
    : "";

  if (s.failed || s.rows.length === 0) {
    return heading + note +
      `<tr><td style="padding:2px 24px 6px;font-family:Arial,sans-serif;font-size:12px;color:${FI.faint}">— veri yok</td></tr>` +
      spacer();
  }

  const head = s.head
    ? `<tr>${s.head.map((h) => `<th align="left" style="${TH}">${esc(h)}</th>`).join("")}</tr>`
    : "";
  const body = s.rows
    .map(
      (row, i) =>
        `<tr style="background:${i % 2 ? FI.zebra : FI.white}">` +
        row.map((c, ci) => cellHtml(c, ci === 0 && !s.head)).join("") +
        `</tr>`,
    )
    .join("");
  const link = s.link
    ? `<tr><td colspan="${s.head?.length ?? 2}" style="padding:6px 12px;border:1px solid ${FI.line};font-family:Arial,sans-serif;font-size:12px;background:${FI.white}"><a href="${BASE_URL}${s.link.href}" style="color:${FI.blue};text-decoration:none">${esc(s.link.label)} →</a></td></tr>`
    : "";

  return (
    heading +
    note +
    `<tr><td style="padding:0 24px">` +
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="552" style="width:552px;border-collapse:collapse">` +
    head +
    body +
    link +
    `</table></td></tr>` +
    spacer()
  );
}

function spacer(h = 10): string {
  return `<tr><td style="height:${h}px;line-height:${h}px;font-size:0">&nbsp;</td></tr>`;
}

function kpiCard(k: Kpi): string {
  const d = delta(k.value, k.prev, k.goodDir);
  const color = d.color === "up" ? FI.up : d.color === "down" ? FI.down : FI.flat;
  return (
    `<td width="172" valign="top" class="kpi" style="width:172px;padding:12px 14px;background:${FI.card};border:1px solid ${FI.cardLine};font-family:Arial,sans-serif">` +
    `<div style="font-size:10px;color:#5a6b7b;letter-spacing:.4px;text-transform:uppercase">${esc(k.label)}</div>` +
    `<div style="font-size:21px;font-weight:800;color:${FI.ink};padding-top:3px">${fmtInt(k.value)}</div>` +
    `<div style="font-size:11px;font-weight:700;color:${color};padding-top:2px">${esc(d.text)}</div>` +
    (k.sub ? `<div style="font-size:10px;color:${FI.muted};padding-top:2px">${esc(k.sub)}</div>` : "") +
    `</td>`
  );
}

function kpiStrip(kpis: Kpi[]): string {
  const gap = `<td width="12" class="kpi-sp" style="width:12px;font-size:0;line-height:0">&nbsp;</td>`;
  const rows: string[] = [];
  for (let i = 0; i < kpis.length; i += 3) {
    const group = kpis.slice(i, i + 3);
    const cells = group.map(kpiCard).join(gap);
    rows.push(
      `<tr><td style="padding:6px 24px"><table role="presentation" cellpadding="0" cellspacing="0" border="0" width="552" style="width:552px;border-collapse:collapse"><tr>${cells}</tr></table></td></tr>`,
    );
  }
  return rows.join("");
}

function preheader(data: WeeklyReportData): string {
  const bits = data.headline.slice(0, 4).map((k) => {
    const d = delta(k.value, k.prev, k.goodDir);
    return `${k.label} ${fmtInt(k.value)} (${d.text})`;
  });
  return (
    `<div style="display:none;max-height:0;overflow:hidden;mso-hide:all">` +
    esc(bits.join(" · ")) +
    "&#8202;&zwnj;&#8202;&zwnj;&#8202;&zwnj;&#8202;&zwnj;" +
    `</div>`
  );
}

export function reportSubject(data: WeeklyReportData): string {
  const a = data.headline[0]; // yeni üye
  const mod = /Moderasyon: (\d[\d.]*)/.exec(data.actionLine)?.[1] ?? "0";
  return `[fikape rapor] Haftalık — ${data.rangeLabel} · ${mod} moderasyon bekliyor · ${fmtInt(a.value)} yeni üye`;
}

export function renderWeeklyReportHtml(data: WeeklyReportData): string {
  const errBanner = data.sectionErrors.length
    ? `<tr><td style="padding:10px 24px;background:#fdf0e8;font-family:Arial,sans-serif;font-size:12px;color:${FI.rust}">⚠️ ${data.sectionErrors.length} bölümün verisi alınamadı — sayılar eksik olabilir.</td></tr>`
    : "";

  const quietNote = data.quietWeek
    ? `<tr><td style="padding:8px 24px;font-family:Arial,sans-serif;font-size:12px;color:${FI.muted}">Bu hafta akış hareketi olmadı — aşağıda bekleyen işler var.</td></tr>`
    : "";

  const html =
    `<!doctype html><html lang="tr"><head>` +
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">` +
    `<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">` +
    `<!--[if mso]><style>table,td{font-family:Arial,sans-serif !important}</style><![endif]-->` +
    `<style>:root{color-scheme:light dark;supported-color-schemes:light dark}a{color:${FI.blue}}` +
    `@media (max-width:620px){.container{width:100%!important}.kpi{display:block!important;width:100%!important;box-sizing:border-box}.kpi-sp{display:none!important}}` +
    `</style></head>` +
    `<body style="margin:0;padding:0;background:${FI.page}">` +
    preheader(data) +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${FI.page}" style="background:${FI.page}">` +
    `<tr><td align="center" style="padding:22px 12px">` +
    `<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" class="container" bgcolor="${FI.white}" style="width:600px;max-width:600px;background:${FI.white}">` +
    `<tr><td style="padding:22px 24px 4px;font-family:Arial,sans-serif">${REPORT_LOGO}` +
    `<div style="font-size:13px;color:${FI.muted};padding-top:6px">Haftalık Rapor · ${esc(data.rangeLabel)} · ${esc(weekOrd(data.isoWeek))}</div></td></tr>` +
    errBanner +
    quietNote +
    kpiStrip(data.headline) +
    `<tr><td style="padding:8px 24px 2px;font-family:Arial,sans-serif;font-size:12px;color:${FI.ink};font-weight:700">Aksiyon gerektiren</td></tr>` +
    `<tr><td style="padding:0 24px 8px;font-family:Arial,sans-serif;font-size:12px;color:${FI.muted};line-height:1.5">${esc(data.actionLine)}</td></tr>` +
    spacer(6) +
    data.sections.map(sectionHtml).join("") +
    `<tr><td style="padding:16px 24px 26px;font-family:Arial,sans-serif;font-size:11px;line-height:1.7;color:${FI.faint}">` +
    `Bu e-postayı fikape yöneticisi (trustLevel ≥ 5) olduğunuz için alıyorsunuz. Yanıtlayarak yönetici raporlarından çıkabilirsiniz.<br>` +
    `Hafta: ${esc(data.rangeLabel)} — UTC Pazartesi 00:00 sınırları.<br>` +
    `Trafik yalnızca araç sayfası sunucu isabetidir; gerçek ziyaret/oturum/kaynak, quiz hunisi, arama sorguları ve e-posta açılma oranı ölçülmüyor.<br>` +
    `<a href="${BASE_URL}/admin" style="color:${FI.blue};text-decoration:none">Admin paneli →</a> · © ${new Date().getUTCFullYear()} fikape.com` +
    `</td></tr>` +
    `</table></td></tr></table></body></html>`;

  // Gmail 102KB kırpma bütçesi — şablon girintilerini sık.
  return html.replace(/\n\s+/g, "");
}

function weekOrd(isoWeek: string): string {
  const n = isoWeek.split("-W")[1];
  return n ? `${Number(n)}. hafta` : isoWeek;
}

// ── Düz metin alternatifi (aynı veri objesinden) ─────────────────
export function renderWeeklyReportText(data: WeeklyReportData): string {
  const L: string[] = [];
  L.push("fikape — Haftalık Rapor");
  L.push(`${data.rangeLabel} · ${weekOrd(data.isoWeek)}`);
  L.push("");
  if (data.sectionErrors.length) L.push(`(!) ${data.sectionErrors.length} bölüm verisi alınamadı`);
  L.push("ÖZET");
  for (const k of data.headline) {
    const d = delta(k.value, k.prev, k.goodDir);
    L.push(`  ${pad(k.label, 30)} ${padL(fmtInt(k.value), 8)}   ${d.text}${k.sub ? "  (" + k.sub + ")" : ""}`);
  }
  L.push("");
  L.push("AKSİYON: " + data.actionLine);
  L.push("");
  for (const s of data.sections) {
    L.push(s.title.toLocaleUpperCase("tr-TR"));
    if (s.note) L.push("  " + s.note);
    if (s.failed || !s.rows.length) { L.push("  — veri yok"); L.push(""); continue; }
    for (const row of s.rows) {
      const label = row[0]?.t ?? "";
      const rest = row.slice(1).map((c) => c.delta ? c.delta.text : c.t).join("   ");
      L.push(`  ${pad(label, 34)} ${rest}`);
    }
    if (s.link) L.push(`  → ${BASE_URL}${s.link.href}`);
    L.push("");
  }
  L.push(`Tam panel: ${BASE_URL}/admin`);
  L.push("Hafta UTC Pazartesi 00:00 sınırları. Trafik = yalnızca araç sayfası sunucu isabeti.");
  return L.join("\n");
}

function pad(s: string, n: number): string { return s.length >= n ? s : s + " ".repeat(n - s.length); }
function padL(s: string, n: number): string { return s.length >= n ? s : " ".repeat(n - s.length) + s; }
