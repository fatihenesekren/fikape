// Telefon numarasını "tel:" bağlantısı için E.164'e yakın bir biçime
// (ör. "+905067995520") normalize eder. Kullanıcı mobilde numarayı elle
// kopyalamak yerine doğrudan dokunup arayabilsin diye — kayıtlı biçim
// henüz garanti edilmediği için ("0506...", "+90 506...", "506..." hepsi
// mümkün) giriş serbest metin kabul edilip burada tek bir kurala indirgenir.
export function toTelHref(raw: string): string {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.startsWith("0")) return `+90${digits.slice(1)}`;
  if (digits.startsWith("90")) return `+${digits}`;
  return `+90${digits}`;
}
