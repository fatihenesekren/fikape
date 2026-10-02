// Katalog görseli atıf (yazar + lisans) bilgisi.
// Kaynaklar: (1) Product.imageCredit (elle/otomatik kaydedilmiş), (2) görsel adresi Wikimedia Commons ise
// Commons API'sinden canlı (önbellekli) okunan extmetadata. Özgür olmayan (adil kullanım) dosyalar reddedilir.

export interface GorselKredisi {
  yazar: string;
  lisans: string;
  lisansUrl?: string | null;
  kaynakUrl?: string | null;
}

const WIKI_UA = { "User-Agent": "fikape.com/1.0 (https://fikape.com; info@fikape.com)" };
const MAKS = { yazar: 200, lisans: 80, url: 500 } as const;

const httpsUrl = (v: unknown): string | null => {
  if (typeof v !== "string" || v.length > MAKS.url) return null;
  try { return new URL(v).protocol === "https:" ? v : null; } catch { return null; }
};

/** Veritabanından/istekten gelen kredi nesnesini doğrular; geçersizse null. */
export function krediDogrula(v: unknown): GorselKredisi | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const yazar = typeof o.yazar === "string" ? o.yazar.trim() : "";
  const lisans = typeof o.lisans === "string" ? o.lisans.trim() : "";
  if (!yazar || !lisans || yazar.length > MAKS.yazar || lisans.length > MAKS.lisans) return null;
  return { yazar, lisans, lisansUrl: httpsUrl(o.lisansUrl), kaynakUrl: httpsUrl(o.kaynakUrl) };
}

/** HTML parçasını düz metne çevirir (etiketleri atar, temel varlıkları çözer). */
export function htmlMetin(html: string): string {
  return html
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Commons dosya adını bulur: upload.wikimedia.org/.../commons/..., Special:FilePath/..., /wiki/File:... */
export function commonsDosyaAdi(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname === "upload.wikimedia.org") {
      const p = u.pathname.split("/").filter(Boolean); // wikipedia, commons, [thumb], a, ab, Dosya.jpg, [NNNpx-Dosya.jpg]
      if (p[0] !== "wikipedia" || p[1] !== "commons") return null; // en/tr vb. yerel (çoğu adil kullanım) yüklemeler dışarıda
      const govde = p[2] === "thumb" ? p.slice(3) : p.slice(2);
      if (govde.length < 3) return null;
      return decodeURIComponent(govde[2]);
    }
    if (u.hostname === "commons.wikimedia.org") {
      const m = u.pathname.match(/^\/wiki\/(?:Special:FilePath\/|File:)(.+)$/i);
      return m ? decodeURIComponent(m[1]).replace(/_/g, " ") : null;
    }
  } catch { /* geçersiz adres */ }
  return null;
}

type MetaDeger = { value?: string };
interface Extmetadata { Artist?: MetaDeger; LicenseShortName?: MetaDeger; LicenseUrl?: MetaDeger; NonFree?: MetaDeger; Credit?: MetaDeger }

/** Commons extmetadata → kredi. Özgür olmayan dosya için { ozgur:false }; okunamazsa null. */
export function extmetadataKredi(dosyaAdi: string, meta: Extmetadata | undefined): (GorselKredisi & { ozgur: true }) | { ozgur: false } | null {
  if (!meta) return null;
  if (meta.NonFree?.value && meta.NonFree.value.toLowerCase() === "true") return { ozgur: false };
  const lisans = meta.LicenseShortName?.value ? htmlMetin(meta.LicenseShortName.value) : "";
  const yazar = (meta.Artist?.value ? htmlMetin(meta.Artist.value) : "") || (meta.Credit?.value ? htmlMetin(meta.Credit.value) : "");
  if (!lisans || !yazar) return null;
  return {
    ozgur: true,
    yazar: yazar.slice(0, MAKS.yazar),
    lisans: lisans.slice(0, MAKS.lisans),
    lisansUrl: httpsUrl(meta.LicenseUrl?.value ? htmlMetin(meta.LicenseUrl.value) : null),
    kaynakUrl: `https://commons.wikimedia.org/wiki/File:${encodeURIComponent(dosyaAdi.replace(/ /g, "_"))}`,
  };
}

/** Commons API'sinden kredi çeker (7 gün önbellek). Hata/bilinmeyen → null. */
export async function commonsKredisiGetir(dosyaAdi: string): Promise<ReturnType<typeof extmetadataKredi>> {
  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + dosyaAdi)}&prop=imageinfo&iiprop=extmetadata&format=json&formatversion=2`,
      { headers: WIKI_UA, signal: AbortSignal.timeout(5000), next: { revalidate: 604800 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { query?: { pages?: { imageinfo?: { extmetadata?: Extmetadata }[] }[] } };
    return extmetadataKredi(dosyaAdi, data.query?.pages?.[0]?.imageinfo?.[0]?.extmetadata);
  } catch {
    return null;
  }
}

/** Görselin gösterilecek kredisi: kayıtlı varsa o, yoksa Commons adresinden canlı; yoksa null. */
export async function gorselKredisi(imageUrl: string | null | undefined, kayitli: unknown): Promise<GorselKredisi | null> {
  const k = krediDogrula(kayitli);
  if (k) return k;
  const dosya = commonsDosyaAdi(imageUrl);
  if (!dosya) return null;
  const r = await commonsKredisiGetir(dosya);
  return r && r.ozgur ? { yazar: r.yazar, lisans: r.lisans, lisansUrl: r.lisansUrl, kaynakUrl: r.kaynakUrl } : null;
}
