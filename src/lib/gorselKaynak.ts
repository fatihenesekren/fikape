// /gorsel-kaynaklari sayfasının saf mantığı (istemcide de çalışır; Prisma/sharp YOK): arama, filtre, marka gruplama.

export interface KaynakSatir {
  slug: string;
  ad: string;
  marka: string;
  kategori: string;
  imageUrl: string;
  yazar: string;
  kaynakUrl: string | null;
  lisans: string;
  lisansUrl: string | null;
}

export const KATEGORI_ETIKET: Record<string, string> = {
  otomobil: "Otomobil", motosiklet: "Motosiklet", kamyonet: "Kamyonet",
  "e-bisiklet": "E-Bisiklet", "e-scooter": "E-Scooter", karavan: "Karavan",
};

/** Arama için: küçük harf + Türkçe/aksanlı harfleri sadeleştir ("Citroën" ≈ "citroen", "İ" ≈ "i"). */
export function aramaAnahtari(s: string): string {
  return (s ?? "")
    .toLocaleLowerCase("tr")
    .replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ı/g, "i").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Onlarca farklı lisans yazımını birkaç ana gruba indirger. */
export function lisansGrubu(lisans: string): string {
  const l = (lisans ?? "").trim();
  if (/official|resmi|üretici|uretici/i.test(l)) return "Üretici görseli";
  if (/cc0|public domain|kamu/i.test(l)) return "CC0 / Kamu malı";
  if (/cc by-sa/i.test(l)) return "CC BY-SA";
  if (/cc by/i.test(l)) return "CC BY";
  return "Diğer";
}
export const LISANS_SIRA = ["CC BY-SA", "Üretici görseli", "CC0 / Kamu malı", "CC BY", "Diğer"];

export interface Filtre { q: string; kategori: string; lisans: string }

export function filtrele(satirlar: KaynakSatir[], f: Filtre): KaynakSatir[] {
  const q = aramaAnahtari(f.q);
  return satirlar.filter((s) => {
    if (f.kategori && s.kategori !== f.kategori) return false;
    if (f.lisans && lisansGrubu(s.lisans) !== f.lisans) return false;
    if (!q) return true;
    return aramaAnahtari(`${s.ad} ${s.marka} ${s.yazar} ${s.lisans}`).includes(q);
  });
}

export interface MarkaGrubu { marka: string; satirlar: KaynakSatir[] }

/** Markaya göre gruplar; markalar Türkçe harf sırasında, her grubun içi ad sırasında. */
export function markayaGrupla(satirlar: KaynakSatir[]): MarkaGrubu[] {
  const harita = new Map<string, KaynakSatir[]>();
  for (const s of satirlar) {
    const l = harita.get(s.marka);
    if (l) l.push(s); else harita.set(s.marka, [s]);
  }
  return [...harita.entries()]
    .sort((a, b) => a[0].localeCompare(b[0], "tr"))
    .map(([marka, l]) => ({ marka, satirlar: [...l].sort((a, b) => a.ad.localeCompare(b.ad, "tr", { numeric: true })) }));
}

/** Çip sayıları: her çipin sayısı DİĞER filtreler uygulanmış hâlde hesaplanır. */
export function sayilar(satirlar: KaynakSatir[], f: Filtre) {
  const kategoriler: Record<string, number> = {};
  for (const s of filtrele(satirlar, { ...f, kategori: "" })) kategoriler[s.kategori] = (kategoriler[s.kategori] ?? 0) + 1;
  const lisanslar: Record<string, number> = {};
  for (const s of filtrele(satirlar, { ...f, lisans: "" })) { const g = lisansGrubu(s.lisans); lisanslar[g] = (lisanslar[g] ?? 0) + 1; }
  return { kategoriler, lisanslar };
}
