// Haftalık rapor e-postası için ortak marka + stil sabitleri. E-posta HTML'i
// &lt;style&gt;'a güvenemez (Gmail/Outlook kırpar) — her hücre inline stil taşır,
// bu yüzden stiller kısa string sabitleri olarak paylaşılır (Gmail ~102KB
// kırpma bütçesi).

export const FI = {
  blue: "#185FA5",
  green: "#3B6D11",
  rust: "#993C1D",
  ink: "#111111",
  muted: "#777777",
  faint: "#999999",
  line: "#c9d2db",
  zebra: "#f6f8fa",
  card: "#f4f7fa",
  cardLine: "#dce6ef",
  page: "#f2f4f6",
  white: "#ffffff",
  up: "#3B6D11", // artış = yeşil
  down: "#993C1D", // azalış = kiremit
  flat: "#777777",
} as const;

// E-posta gönderen adresi — src/lib/email.ts ile AYNI env değişkenini okur;
// prod'da EMAIL_FROM tek yerden @fikape.com'a çekilince ikisi birden güncellenir.
export const REPORT_FROM =
  process.env.EMAIL_FROM ?? "fikape raporlar <onboarding@resend.dev>";

// Wordmark — rapor varyantı: koyu zeminde de okunsun diye nokta rengi #999
// (transactional şablonlardaki #ccc yerine).
export const REPORT_LOGO = `<span style="font-size:20px;font-weight:900;letter-spacing:-1px"><span style="color:${FI.blue}">fi</span><span style="color:${FI.faint}">·</span><span style="color:${FI.green}">ka</span><span style="color:${FI.faint}">·</span><span style="color:${FI.rust}">pe</span></span>`;

// Paylaşılan hücre stilleri (kısa tutulmuş — Outlook için font-family her td'de şart).
export const CELL = `padding:8px 12px;border:1px solid ${FI.line};font-family:Arial,sans-serif;font-size:13px;line-height:1.4;color:${FI.ink};background:${FI.white}`;
export const CELL_MUTED = `padding:8px 12px;border:1px solid ${FI.line};font-family:Arial,sans-serif;font-size:13px;line-height:1.4;color:${FI.muted};background:${FI.white}`;
export const CELL_NUM = `padding:8px 12px;border:1px solid ${FI.line};font-family:Arial,sans-serif;font-size:13px;font-weight:700;color:${FI.ink};background:${FI.white};white-space:nowrap`;
export const TH = `padding:8px 12px;border:1px solid ${FI.line};font-family:Arial,sans-serif;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.3px;color:${FI.muted};background:${FI.zebra}`;
export const H2 = `padding:22px 24px 6px;font-family:Arial,sans-serif;font-size:15px;font-weight:800;color:${FI.ink}`;
