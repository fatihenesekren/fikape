// Resmi (statik) katalog gizleme düzeltmeleri — saf fonksiyonlar (sunucu ve istemci paylaşır).
// Yalnız statik katalog verisini süzer; canlı (veritabanı) araçlar pasife alma ile yönetilir.
import { adAnahtar } from "@/lib/katalog/ek";
import type { LegacyMake } from "@/lib/katalog/ek";
import type { KatalogMarkaDosyasi } from "@/lib/katalog/tipler";

export type OverrideScope = "BRAND" | "MODEL" | "TRIM";

/** Herkese açık, anahtarlanmış gizleme kaydı (b/m/v/p = adAnahtar değerleri; boş = "hepsi"). */
export interface GizliKayit { scope: OverrideScope; b: string; m: string; v: string; p: string }

export function overrideAnahtarlari(g: { marka: string; model?: string | null; versiyon?: string | null; paket?: string | null }) {
  return {
    brandKey: adAnahtar(g.marka),
    modelKey: g.model ? adAnahtar(g.model) : "",
    versiyonKey: g.versiyon ? adAnahtar(g.versiyon) : "",
    paketKey: g.paket ? adAnahtar(g.paket) : "",
  };
}

const markaGizliMi = (gizli: GizliKayit[], marka: string) => {
  const b = adAnahtar(marka);
  return gizli.some((g) => g.scope === "BRAND" && g.b === b);
};
const modelGizliMi = (gizli: GizliKayit[], marka: string, model: string) => {
  const b = adAnahtar(marka), m = adAnahtar(model);
  return gizli.some((g) => g.scope === "MODEL" && g.b === b && g.m === m);
};
/** Versiyon gizli mi? paket verilmezse yalnız "tüm paketler" gizlemesi (g.p boş) sayılır; verilirse tam eşleşme de sayılır. */
const trimGizliMi = (gizli: GizliKayit[], marka: string, model: string, v: string, p: string | null) => {
  const b = adAnahtar(marka), m = adAnahtar(model), vk = adAnahtar(v), pk = p ? adAnahtar(p) : "";
  return gizli.some((g) => g.scope === "TRIM" && g.b === b && g.m === m && g.v === vk && (g.p === "" || g.p === pk));
};

/** Statik marka listesinden gizli markaları çıkarır. */
export function markalariSuz<T extends { marka: string }>(markalar: T[], gizli: GizliKayit[]): T[] {
  return gizli.length ? markalar.filter((m) => !markaGizliMi(gizli, m.marka)) : markalar;
}

/** Statik marka dosyasından gizli model/versiyon-paket kayıtlarını çıkarır (girdiyi değiştirmez). null → marka gizli. */
export function markaDosyasiSuz(dosya: KatalogMarkaDosyasi | null, gizli: GizliKayit[]): KatalogMarkaDosyasi | null {
  if (!dosya || gizli.length === 0) return dosya;
  if (markaGizliMi(gizli, dosya.marka)) return null;
  const modeller = dosya.modeller
    .filter((mo) => !modelGizliMi(gizli, dosya.marka, mo.ad))
    .map((mo) => {
      const tipler = mo.tipler.filter((t) => t.e || !trimGizliMi(gizli, dosya.marka, mo.ad, t.v, t.p));
      const nesiller = mo.nesiller.map((n) => {
        if (!n.el) return n;
        const versiyonlar = n.el.versiyonlar.filter((v) => !trimGizliMi(gizli, dosya.marka, mo.ad, v, null) || adAnahtar(v) === adAnahtar("Standart"));
        return { ...n, el: { ...n.el, versiyonlar } };
      });
      return { ...mo, tipler, nesiller };
    });
  return { ...dosya, modeller };
}

/** Eski liste biçimi (e-scooter / e-bisiklet / karavan) için aynı süzme. */
export function legacySuz(makes: LegacyMake[], gizli: GizliKayit[]): LegacyMake[] {
  if (gizli.length === 0) return makes;
  return makes
    .filter((mk) => !markaGizliMi(gizli, mk.make))
    .map((mk) => ({
      ...mk,
      models: mk.models
        .filter((mo) => mo.name === "Diğer" || !modelGizliMi(gizli, mk.make, mo.name))
        .map((mo) => {
          const versions = mo.versions.filter((v) => v === "Diğer" || !trimGizliMi(gizli, mk.make, mo.name, v, null));
          const trimsByVersion = mo.trimsByVersion
            ? Object.fromEntries(
                Object.entries(mo.trimsByVersion)
                  .filter(([v]) => v === "Diğer" || !trimGizliMi(gizli, mk.make, mo.name, v, null))
                  .map(([v, l]) => [v, l.filter((p) => p === "Diğer" || !trimGizliMi(gizli, mk.make, mo.name, v, p))]),
              )
            : undefined;
          return { ...mo, versions, trimsByVersion };
        }),
    }));
}
