// /araclar arama sonucunun saf karar mantığı (Prisma yok): motor id'lerini kategori havuzuna uygular,
// sayfanın hangi "bulunamadı" durumunda olduğunu ve aramanın loglanıp loglanmayacağını belirler.

/** Motor sırasını koruyarak havuzu id listesine indirger (tam eşleşmede marka/yıl, benzerde similarity sırası). */
export function havuzuMotorSirasinaGore<T extends { id: number }>(pool: T[], ids: number[]): T[] {
  const rank = new Map(ids.map((id, i) => [id, i]));
  return pool.filter((p) => rank.has(p.id)).sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
}

export type AramaSonucDurumu =
  | "arama-yok"     // q yok → normal liste
  | "arama-bos"     // q var, motor hiçbir şey bulamadı → tam "öner" kartı
  | "arama-benzer"  // yalnız benzer sonuç → sarı uyarı + son sayfa sonunda kart
  | "arama-var"     // tam eşleşme → küçük sönük öner satırı
  | "filtre-bos";   // arama sonucu var ama marka/özellik filtresi hepsini eledi

export function aramaSonucDurumu(a: {
  aramaVar: boolean;
  motorSayisi: number;
  benzer: boolean;
  filtreSonrasi: number;
}): AramaSonucDurumu {
  if (!a.aramaVar) return "arama-yok";
  if (a.motorSayisi === 0) return "arama-bos";
  if (a.filtreSonrasi === 0) return "filtre-bos";
  return a.benzer ? "arama-benzer" : "arama-var";
}

/** Aynı aramanın sayfalama/filtre tıklamalarıyla tekrar tekrar loglanmasını önler. */
export function aramaLoglansinMi(a: {
  aramaVar: boolean;
  sayfa: number;
  markaSecili: boolean;
  facetSecili: boolean;
}): boolean {
  return a.aramaVar && a.sayfa === 1 && !a.markaSecili && !a.facetSecili;
}
