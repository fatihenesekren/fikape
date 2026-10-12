import { z } from "zod";
import { temizMetin } from "@/lib/katalog/metin";
import { ekYilGecerli } from "@/lib/katalog/ek";
import { KATEGORILER, VITESLER, YAKITLAR } from "@/lib/katalog/alanlar";
import { trimAdi } from "@/lib/katalog/secim";
import { slugify } from "@/lib/slugify";
import { YAKIT_VITES_KATEGORILERI } from "@/lib/aracKarsilastir";
import { KIRILIM_ANAHTARLARI, kirilimBul } from "@/lib/katalogOneri/kirilimlar";

const adAlani = (max: number) =>
  z.string()
    .transform((v) => temizMetin(v) ?? "")
    .pipe(z.string().min(1, "Boş olamaz").max(max, `En fazla ${max} karakter`))
    .refine((v) => slugify(v).length > 0, "En az bir harf veya rakam (a-z, 0-9) içermeli");

const istegeBagliMetin = (max: number) =>
  z.string().nullable().optional().transform((v) => (typeof v === "string" ? temizMetin(v) || null : null)).pipe(z.string().max(max, `En fazla ${max} karakter`).nullable());

// Yakıt/vites yalnız motorlu kategorilerde anlamlı (e-scooter, e-bisiklet, karavan için sorulmaz) — tanım aracKarsilastir.ts'te.
export { YAKIT_VITES_KATEGORILERI };

export const aracEkleSema = z.object({
  kategori: z.enum(KATEGORILER),
  marka: adAlani(80),
  model: adAlani(100),
  versiyon: istegeBagliMetin(100),
  paket: istegeBagliMetin(100),
  yil: z.number().int().refine((y) => ekYilGecerli(y), "Geçerli bir model yılı giriniz"),
  yakit: z.enum(YAKITLAR).nullable().optional(),
  vites: z.enum(VITESLER).nullable().optional(),
  beygir: z.number().int().min(40).max(2000).nullable().optional(),
  benzerlikOnayi: z.boolean().default(false),
  bildirimGonder: z.boolean().default(false),
  /** Taslak: kayıt pasif (yayında değil) oluşur; veri girildikten sonra "Geri al" ile yayınlanır. */
  taslak: z.boolean().default(false),
  /** Aylık aday listesinden ekleniyorsa: aday kaydı aynı işlemde EKLENDI/TASLAK olur. */
  adayId: z.number().int().positive().optional(),
  /** Aday kırılımı: pick-up/van/karavan türü alanını otomatik yazar. */
  kirilim: z.enum(KIRILIM_ANAHTARLARI).optional(),
}).strict().superRefine((v, ctx) => {
  if (v.kirilim && kirilimBul(v.kirilim)?.kategori !== v.kategori) {
    ctx.addIssue({ code: "custom", path: ["kirilim"], message: "Kırılım seçilen kategoriyle uyuşmuyor" });
  }
  if ((YAKIT_VITES_KATEGORILERI as readonly string[]).includes(v.kategori)) {
    if (!v.yakit) ctx.addIssue({ code: "custom", path: ["yakit"], message: "Yakıt zorunlu" });
    if (!v.vites) ctx.addIssue({ code: "custom", path: ["vites"], message: "Vites zorunlu" });
  }
  if (trimAdi(v.versiyon ?? null, v.paket ?? null).length > 150) ctx.addIssue({ code: "custom", path: ["versiyon"], message: "Versiyon + donanım en fazla 150 karakter" });
});
export type AracEkle = z.infer<typeof aracEkleSema>;

export const aracDuzeltSema = z.object({
  /** Beklenen son güncelleme (ISO): başka bir yönetici arada değiştirdiyse 409 */
  beklenenGuncelleme: z.string().min(1),
  marka: adAlani(80).optional(),
  model: adAlani(100).optional(),
  versiyon: istegeBagliMetin(100).optional(),
  paket: istegeBagliMetin(100).optional(),
  yil: z.number().int().refine((y) => ekYilGecerli(y), "Geçerli bir model yılı giriniz").optional(),
  yakit: z.enum(YAKITLAR).nullable().optional(),
  vites: z.enum(VITESLER).nullable().optional(),
  benzerlikOnayi: z.boolean().default(false),
}).strict().superRefine((v, ctx) => {
  const alanlar = ["marka", "model", "versiyon", "paket", "yil", "yakit", "vites"] as const;
  if (!alanlar.some((a) => v[a] !== undefined)) ctx.addIssue({ code: "custom", message: "Değiştirilecek alan yok" });
});
export type AracDuzelt = z.infer<typeof aracDuzeltSema>;

export const yenidenAdlandirSema = z.object({
  yeniAd: adAlani(100),
  beklenenEskiAd: z.string().min(1).max(200),
}).strict();

export const birlestirSema = z.object({
  tur: z.enum(["MARKA", "MODEL"]),
  kaynakId: z.number().int().positive(),
  hedefId: z.number().int().positive(),
  dryRun: z.boolean().default(true),
  onay: z.boolean().default(false),
}).strict();

export const silmeSema = z.object({ onayMetni: z.string().min(1).max(250) }).strict();
export const durumSema = z.object({ islem: z.enum(["pasif", "aktif"]), neden: istegeBagliMetin(300) }).strict();

export const overrideSema = z.object({
  kategori: z.enum(KATEGORILER),
  scope: z.enum(["BRAND", "MODEL", "TRIM"]),
  /** Statik katalogdaki GÖRÜNEN adlar; anahtarlar sunucuda üretilir */
  marka: z.string().min(1).max(120),
  model: z.string().max(160).optional(),
  versiyon: z.string().max(160).optional(),
  paket: z.string().max(160).optional(),
  note: istegeBagliMetin(300).optional(),
  /** Tüm marka gizleme gibi geniş işlemlerde etki özeti gösterildikten sonra true */
  onay: z.boolean().default(false),
}).strict();

export function zodMesaji(e: z.ZodError): string {
  return e.issues.map((i) => `${i.path.join(".") || "gövde"}: ${i.message}`).join("; ").slice(0, 400);
}

/** Product.slug üretimi (öneri akışıyla aynı kural). */
export function urunSlugTabani(marka: string, model: string, trimName: string | null, yil: number | null): string {
  return slugify([marka, model, trimName, yil].filter(Boolean).join("-"));
}

/**
 * Yeni ürünün slug'ı: kural olarak ad+yıl tabanının kendisidir (bkz. urunSlugTabani). Vites soneki YALNIZ taban adres zaten
 * doluysa ve vites verilmişse eklenir (aynı ad/yıl/versiyonda farklı vitesli kayıtları ayırmak için); aksi hâlde taban kalır.
 * Böylece slug ≠ ad+yıl tabanı sapması (ör. "...-otomatik") yeni kayıtlarda oluşmaz.
 */
export function urunSlugu(baz: string, vites: string | null | undefined, bazDolu: boolean): string {
  return bazDolu && vites ? `${baz}-${slugify(vites)}` : baz;
}
