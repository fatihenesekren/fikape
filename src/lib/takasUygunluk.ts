import { prisma } from "@/lib/prisma";

// Takasa açma şartı — TEK kaynak. Önceden aynı kural üç yerde ayrı ayrı yazılıydı
// (Garajım sayfası, POST /api/trades, yeniden açma) ve yeniden açma hiç kontrol
// etmiyordu. Kural: araç garajda (CURRENT) olmalı ve o araca bağlı, yayınlanmış
// bir yorumda en az bir onaylı fotoğraf bulunmalı. Genel trustLevel bu şart için
// yeterli değil (bkz. api/trades/route.ts) — başka bir araçtaki yorumla
// yükselmiş olabilir.
//
// Zaman/durum bağımlı kontroller (günlük limit, "zaten aktif ilan var", ban,
// özellik bayrağı) BURADA değil, çağıran tarafta kalır; bu dosya yalnızca "bu
// araç şart olarak hazır mı ve değilse sıradaki adım ne" sorusunu yanıtlar.

export type TakasAdimKodu = "GARAJDA" | "YORUM" | "FOTOGRAF";

export type TakasDurum =
  | "UYGUN"
  | "GARAJDA_DEGIL"
  | "YORUM_YOK"
  | "YORUM_INCELEMEDE"
  | "FOTO_YOK"
  | "FOTO_INCELEMEDE"
  | "FOTO_REDDEDILDI";

export interface TakasUygunlukGirdisi {
  sahiplik: string; // OwnershipStatus: "CURRENT" | "PAST"
  yorumlar: { id: number; durum: string; fotolar: string[] }[]; // durum: ReviewStatus, fotolar: PhotoStatus listesi
}

export interface TakasUygunluk {
  uygun: boolean;
  durum: TakasDurum;
  adimlar: { kod: TakasAdimKodu; tamam: boolean }[];
  tamamlanan: number;
  toplam: number;
  /** "Yoruma fotoğraf ekle" hedefi: yayınlanmış yorumun kimliği (yoksa null). */
  duzenlenecekYorumId: number | null;
}

const yayinli = (g: TakasUygunlukGirdisi) => g.yorumlar.filter((y) => y.durum === "PUBLISHED");

// Yeni şart = bu diziye bir eleman. Garajım'ın şart listesi de buradan üretilir.
const KURALLAR: { kod: TakasAdimKodu; tamam: (g: TakasUygunlukGirdisi) => boolean }[] = [
  { kod: "GARAJDA", tamam: (g) => g.sahiplik === "CURRENT" },
  { kod: "YORUM", tamam: (g) => yayinli(g).length > 0 },
  { kod: "FOTOGRAF", tamam: (g) => yayinli(g).some((y) => y.fotolar.includes("APPROVED")) },
];

function durumBul(g: TakasUygunlukGirdisi): TakasDurum {
  if (g.sahiplik !== "CURRENT") return "GARAJDA_DEGIL";
  const yayinlilar = yayinli(g);
  if (yayinlilar.some((y) => y.fotolar.includes("APPROVED"))) return "UYGUN";
  if (yayinlilar.length > 0) {
    const fotolar = yayinlilar.flatMap((y) => y.fotolar);
    if (fotolar.includes("PENDING")) return "FOTO_INCELEMEDE";
    if (fotolar.includes("REJECTED")) return "FOTO_REDDEDILDI";
    return "FOTO_YOK";
  }
  return g.yorumlar.some((y) => y.durum === "PENDING") ? "YORUM_INCELEMEDE" : "YORUM_YOK";
}

/** Saf karar fonksiyonu — veritabanına gitmez, testi kolay. */
export function takasUygunlukKararVer(g: TakasUygunlukGirdisi): TakasUygunluk {
  const adimlar = KURALLAR.map((k) => ({ kod: k.kod, tamam: k.tamam(g) }));
  const durum = durumBul(g);
  return {
    uygun: durum === "UYGUN",
    durum,
    adimlar,
    tamamlanan: adimlar.filter((a) => a.tamam).length,
    toplam: adimlar.length,
    duzenlenecekYorumId: yayinli(g)[0]?.id ?? null,
  };
}

export interface TakasSonrakiAdim {
  baslik: string;
  metin: string;
  buton: { etiket: string; href: string } | null;
}

/** Kullanıcıya gösterilen sıradaki adım — iç terim (CURRENT, APPROVED, trustLevel) metne sızmaz. */
export function takasSonrakiAdim(u: TakasUygunluk, productSlug: string): TakasSonrakiAdim {
  const kalan = u.toplam - u.tamamlanan;
  const baslik = u.uygun ? "Takasa açmaya hazırsınız" : `Takasa ${kalan} adım kaldı`;
  switch (u.durum) {
    case "UYGUN":
      return { baslik, metin: "Aracınızı takasa açabilirsiniz.", buton: null };
    case "GARAJDA_DEGIL":
      return { baslik: "Bu araç garajınızda görünmüyor", metin: "Takasa açmak için aracın garajınızda olması gerekir.", buton: null };
    case "YORUM_YOK":
      return {
        baslik,
        metin: "Bu araç için fotoğraflı bir yorum yazın. Yorumunuzdaki fotoğraf, ilan sayfasında aracınızı daha inandırıcı gösterir.",
        buton: { etiket: "Fotoğraflı yorum yazın", href: `/yorum-yaz?arac=${productSlug}&takas=1` },
      };
    case "YORUM_INCELEMEDE":
      return {
        baslik,
        metin: "Yorumunuz inceleniyor. Yayınlandığında ve fotoğrafınız uygun bulunduğunda aracınızı takasa açabileceksiniz; bu arada yapmanız gereken bir şey yok.",
        buton: null,
      };
    case "FOTO_YOK":
      return {
        baslik,
        metin: "Yayınlanan yorumunuza en az bir fotoğraf ekleyin.",
        buton: u.duzenlenecekYorumId ? { etiket: "Yorumunuza fotoğraf ekleyin", href: `/yorumum/${u.duzenlenecekYorumId}/duzenle` } : null,
      };
    case "FOTO_INCELEMEDE":
      return { baslik, metin: "Fotoğrafınız inceleniyor. Uygun bulunursa aracınızı takasa açabileceksiniz.", buton: null };
    case "FOTO_REDDEDILDI":
      return {
        baslik,
        metin: "Bu fotoğraf kullanılamadı. Aracın genel görünümünü gösteren başka bir fotoğraf yükleyebilirsiniz.",
        buton: u.duzenlenecekYorumId ? { etiket: "Yeni fotoğraf yükleyin", href: `/yorumum/${u.duzenlenecekYorumId}/duzenle` } : null,
      };
  }
}

/** API hata metni (403/404). */
export function takasEngelMesaji(u: TakasUygunluk): string {
  if (u.durum === "GARAJDA_DEGIL") return "Bu araç garajınızda değil.";
  return "Takasa açmak için bu aracın fotoğraflı bir yorumunun yayınlanmış olması gerekiyor.";
}

const SECIM = {
  id: true,
  ownershipStatus: true,
  usageAmount: true,
  usageUnit: true,
  product: { select: { slug: true, name: true, category: { select: { slug: true } } } },
  reviews: { select: { id: true, status: true, photos: { select: { status: true } } } },
  tradeListings: { where: { isActive: true }, select: { id: true }, take: 1 },
} as const;

type KayitTipi = {
  id: number;
  ownershipStatus: string;
  usageAmount: number | null;
  usageUnit: string | null;
  product: { slug: string; name: string; category: { slug: string } | null };
  reviews: { id: number; status: string; photos: { status: string }[] }[];
  tradeListings: { id: number }[];
};

/** Bir aracın uygunluğu + panelde göstermek için araç bilgisi ve aktif ilan kimliği. */
export interface TakasAracUygunlugu {
  userProductId: number;
  uygunluk: TakasUygunluk;
  productSlug: string;
  productName: string;
  aktifIlanId: number | null;
  /** İlan formundaki km alanının ön değeri (Garajım'daki alış bilgisiyle ortak, yalnız km biriminde). */
  km: number | null;
  categorySlug: string;
}

function kayittanUygunluk(k: KayitTipi): TakasUygunluk {
  return takasUygunlukKararVer({
    sahiplik: k.ownershipStatus,
    yorumlar: k.reviews.map((r) => ({ id: r.id, durum: r.status, fotolar: r.photos.map((p) => p.status) })),
  });
}

/**
 * Kullanıcının TÜM araçları için tek sorguyla uygunluk (Garajım, panel).
 * userId yalnız oturumdan gelmeli; başkasının araçları buraya girmez.
 */
export async function takasUygunlukToplu(userId: number): Promise<Map<number, TakasAracUygunlugu>> {
  const kayitlar = await prisma.userProduct.findMany({ where: { userId }, select: SECIM, orderBy: { id: "asc" } });
  return new Map(
    kayitlar.map((k) => [
      k.id,
      {
        userProductId: k.id,
        uygunluk: kayittanUygunluk(k),
        productSlug: k.product.slug,
        productName: k.product.name,
        aktifIlanId: k.tradeListings[0]?.id ?? null,
        km: k.usageUnit === "km" ? k.usageAmount : null,
        categorySlug: k.product.category?.slug ?? "",
      },
    ]),
  );
}

// Panelde tek bir "sıradaki iş" gösterilir: hedefe en yakın araç. Sıra: ilanı olan > hazır > fotoğraf
// inceleniyor > fotoğraf eksik/reddedildi > yorum inceleniyor > yorum yok. Garajda olmayan araç seçilmez.
const ONCELIK: Record<TakasDurum, number> = {
  UYGUN: 1,
  FOTO_INCELEMEDE: 2,
  FOTO_REDDEDILDI: 3,
  FOTO_YOK: 3,
  YORUM_INCELEMEDE: 4,
  YORUM_YOK: 5,
  GARAJDA_DEGIL: 99,
};

/** Küçük = hedefe daha yakın (0: aktif ilanı var). Panelde araç listesini ve en ilerideki aracı seçmek için. */
export function aracOnceligi(a: TakasAracUygunlugu): number {
  return a.aktifIlanId != null ? 0 : ONCELIK[a.uygunluk.durum];
}

export function enIlerideArac(araclar: TakasAracUygunlugu[]): TakasAracUygunlugu | null {
  let en: TakasAracUygunlugu | null = null;
  let enSira = Infinity;
  for (const a of araclar) {
    if (a.uygunluk.durum === "GARAJDA_DEGIL") continue;
    const sira = aracOnceligi(a);
    if (sira < enSira) {
      en = a;
      enSira = sira;
    }
  }
  return en;
}

/** Tek araç için uygunluk. Araç kullanıcıya ait değilse null (varlık bilgisi sızdırılmaz). */
export async function takasUygunlukGetir(userId: number, userProductId: number): Promise<TakasUygunluk | null> {
  const k = await prisma.userProduct.findFirst({ where: { id: userProductId, userId }, select: SECIM });
  return k ? kayittanUygunluk(k) : null;
}
