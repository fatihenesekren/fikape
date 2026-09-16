import { prisma } from "@/lib/prisma";
import { generateGeminiText, currentGeminiModelVersion, GeminiError } from "@/lib/ai/gemini";
import { checkContent } from "@/lib/reviewValidation";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { buildSpecList } from "@/lib/buildSpecList";

// ≥5 gerçek yorumda "AI Yorum Özeti"ne dönülür, sonrasında her +5 yorumda
// (10, 15, 20…) yeniden üretilir — aradaki her tekil yorumda değil.
const REVIEWS_SUMMARY_THRESHOLD = 5;

// NOT: Sitenin H1 başlığındaki kısaltma mantığını (trim varsa model adını
// göstermeme — bkz. generateMetadata) BİLEREK kullanmıyoruz. Orada model adı
// sayfanın diğer yerlerinde (görsel, breadcrumb) zaten görünür; burada AI'ın
// elindeki TEK bilgi bu string olduğu için model adını asla düşürmüyoruz —
// aksi halde "Volkswagen 2.0 TDI" gibi araç kimliğini kaybeden bir tanım
// modele gidip anlamsız/yanlış bir özet üretiyor (canlı örnekte tespit edildi).
function productDisplayName(product: {
  name: string;
  trimName: string | null;
  year: number | null;
  brand: { name: string };
  model: { name: string };
}): string {
  const modelName = stripModelGenRange(product.model.name);
  const trimPart = product.trimName ? ` ${product.trimName.replace(/\s[-–—]\s/, " ")}` : "";
  return `${product.brand.name} ${modelName}${trimPart}${product.year ? ` ${product.year}` : ""}`;
}

// Kendi doğrulanmış DB verimiz (admin girişli, "Teknik Özellikler" sekmesiyle
// aynı kaynak — bkz. buildSpecList) — web'den gelmediği için halüsinasyon
// riski taşımaz, modele doğru kategori bağlamı (EV/ICE, gövde tipi, vites)
// verir. Yine de modelin bu rakamları metne aynen kopyalamasını istemiyoruz
// (bkz. prompt talimatı), sadece bağlam olarak kullansın diye veriliyor.
function specsContextText(categorySlug: string, attrs: unknown): string {
  const specs = buildSpecList(categorySlug, attrs).slice(0, 8);
  if (specs.length === 0) return "";
  return specs.map((s) => `- ${s.label}: ${s.value}`).join("\n");
}

// Dengeli-gerçekçi ton: "olumlu" yönlendirme yok, spesifik/doğrulanamaz rakam
// iddiası yasak (yakıt tüketimi, menzil, arıza sıklığı gibi somut sayılar
// halüsinasyon riski taşır) — sadece genel, ihtiyatlı bir izlenim metni.
const SINGLE_CARD_SYSTEM_PROMPT = `Sen bir araç bilgi platformu için tarafsız bir asistansın. Sana verilen araç hakkında genel bilinen izlenimini 2-3 cümlelik KISA bir Türkçe metinle özetle.

Kurallar:
- Dengeli ve gerçekçi ol — ne abartılı olumlu ne karamsar bir ton kullan. Bilinen zayıf yönler varsa nazikçe belirt, sadece övgü yazma.
- Yakıt tüketimi, menzil, 0-100, arıza oranı gibi SPESİFİK rakamlar UYDURMA. Somut bir sayı biliyorsan bile yazma, "genel olarak", "kullanıcılar arasında" gibi genel ifadeler kullan.
- Donanım/güvenlik özelliği hakkında HİÇBİR iddiada bulunma — ne spesifik ("ABS yok") ne genel ifadeyle ("modern güvenlik donanımları eksik", "temel donanıma sahip" gibi). Aşağıda verilen doğrulanmış teknik özellikler dışında herhangi bir donanımın var ya da yok olduğuna dair hiçbir şey yazma, bu konuyu hiç açma.
- Belirli bir web sitesi, forum veya kişi adı ANMA.
- Reklam, pazarlama dili kullanma; ürün açıklaması değil, tarafsız bir genel izlenim yaz.
- Sadece özet metni yaz, başlık veya madde işareti kullanma, düz paragraf olsun.
- Hedef uzunluk yaklaşık 500 karakter — ama cümleni yarıda kesme, doğal bir şekilde bitir. Kesinlikle 750 karakteri geçme.
- Aşağıdaki teknik özellikler doğrulanmıştır, aracı doğru tanımlamak için (örn. elektrikli mi benzinli mi, SUV mü sedan mı, otomatik mi manuel mi) bu bağlamı kullan — ama rakamları (güç, menzil, motor hacmi gibi) metne AYNEN yazma, sadece genel bir nitelendirmeye çevir.

Araç: {VEHICLE}
{SPECS_BLOCK}`;

const REVIEWS_SUMMARY_SYSTEM_PROMPT = `Aşağıda bir araç için gerçek kullanıcıların yazdığı yorumlar var. Bu yorumları TARAFSIZ şekilde 2-3 cümlede özetle.

Kurallar:
- Yorumlarda öne çıkan ortak olumlu VE olumsuz noktaları dengeli şekilde yansıt — sadece olumlu olanları seçme.
- Yorumlarda geçmeyen hiçbir bilgi/rakam uydurma.
- Kullanıcı adı veya kişisel detay anma.
- Sadece özet metni yaz, başlık veya madde işareti kullanma, düz paragraf olsun.
- Hedef uzunluk yaklaşık 500 karakter — ama cümleni yarıda kesme, doğal bir şekilde bitir. Kesinlikle 750 karakteri geçme.

Araç: {VEHICLE}

Yorumlar:
{REVIEWS}`;

// Üretim modelinin ara sıra bıraktığı bozuk kelime/yazım-noktalama hataları
// için (canlı örnekte tespit edildi: "karşılasa gra,") ikinci, ayrı bir
// düzeltme çağrısı — anlamı/uzunluğu değiştirmeden sadece yazım/dilbilgisi/
// noktalama hatalarını onarır. Bu adım başarısız olursa (API hatası vb.)
// orijinal metinle devam edilir, admin onayı zaten son güvenlik katmanı.
const PROOFREAD_PROMPT = `Aşağıdaki Türkçe metinde yazım, dilbilgisi veya noktalama hatası varsa düzelt. Anlamı, uzunluğu ve üslubu DEĞİŞTİRME, sadece hataları onar. Hata yoksa metni aynen geri ver. Sadece düzeltilmiş metni yaz, başka açıklama ekleme.

Metin: {TEXT}`;

async function proofread(text: string): Promise<string> {
  try {
    const raw = await generateGeminiText(PROOFREAD_PROMPT.replace("{TEXT}", text));
    const corrected = raw.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    // Düzeltme adımı metni anlamsız şekilde kısaltır/boşaltırsa ya da aşırı
    // uzatırsa (yanlış yorumlama ihtimali) orijinali koru.
    if (!corrected || corrected.length < text.length * 0.6 || corrected.length > text.length * 1.4) {
      return text;
    }
    return corrected;
  } catch {
    return text;
  }
}

async function safeGenerate(prompt: string): Promise<string | null> {
  try {
    const raw = await generateGeminiText(prompt);
    const draft = raw.replace(/^["'\s]+|["'\s]+$/g, "").trim();
    if (!draft) return null;

    // 750 = DB alanının tam sınırı — model buna kesinlikle uymazsa (nadir)
    // burada sert kesme son çare, normalde talimata uyup altında kalıyor.
    const text = (await proofread(draft)).slice(0, 750).trim();
    if (!text) return null;

    const check = checkContent(text);
    if (!check.ok) {
      // Tam metin loglanıyor (kısa kesme değil) — checkContent'in kelime-sınırı
      // gözetmeyen substring kontrolü ara sıra yanlış-pozitif verebiliyor (bkz.
      // canlıda tespit edilen Honda CB500F vakası), hangi kelimenin tetiklediğini
      // görebilmek için tam metne ihtiyaç var.
      console.error("[ai-vehicle-summary] içerik filtresine takıldı:", check.rule, "\n" + text);
      return null;
    }
    return text;
  } catch (e) {
    if (e instanceof GeminiError) console.error("[ai-vehicle-summary]", e.message);
    else console.error("[ai-vehicle-summary] beklenmeyen hata", e);
    return null;
  }
}

// Tek giriş noktası — ürün aktivasyonu ve yorum onayı sonrasında çağrılır.
// Gereksiz LLM çağrısı yapmamak için önce gerçek yorum sayısına bakar: eşiği
// geçtiyse doğrudan REVIEWS_SUMMARY üretir, geçmediyse SINGLE_CARD dener
// (zaten bir kaydı varsa dokunmaz).
export async function syncAiVehicleSummary(productId: number): Promise<void> {
  const publishedCount = await prisma.review.count({ where: { productId, status: "PUBLISHED" } });
  if (publishedCount >= REVIEWS_SUMMARY_THRESHOLD) {
    await checkAndRegenerateReviewsSummary(productId);
  } else {
    await generateSingleCardSummary(productId);
  }
}

// Ürün onaylanıp yayına alındığında çağrılır — henüz gerçek yorumu yoksa
// PENDING_APPROVAL durumunda bir SINGLE_CARD üretir. Admin onaylamadan
// canlıya çıkmaz (bkz. proje kararı: ilk AI mesajı admin onaylı).
export async function generateSingleCardSummary(productId: number): Promise<void> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: {
      name: true, trimName: true, year: true, attributes: true,
      brand: { select: { name: true } },
      model: { select: { name: true } },
      category: { select: { slug: true } },
    },
  });
  if (!product) return;

  const vehicleName = productDisplayName(product);
  const specsText = specsContextText(product.category?.slug ?? "", product.attributes);
  const specsBlock = specsText ? `\nDoğrulanmış teknik özellikler:\n${specsText}` : "";
  const prompt = SINGLE_CARD_SYSTEM_PROMPT.replace("{VEHICLE}", vehicleName).replace("{SPECS_BLOCK}", specsBlock);
  const summaryText = await safeGenerate(prompt);
  if (!summaryText) return;

  await prisma.aiVehicleSummary.upsert({
    where: { productId },
    create: {
      productId,
      mode: "SINGLE_CARD",
      status: "PENDING_APPROVAL",
      summaryText,
      modelVersion: currentGeminiModelVersion(),
    },
    // Ürün daha önce reddedilmiş/onaylanmış bir kayda sahipse üzerine yazmıyoruz —
    // bu fonksiyon sadece ürünün İLK aktivasyonunda, kayıt hiç yokken anlamlı.
    update: {},
  });
}

// Bir yorum PUBLISHED olduğunda çağrılır. Gerçek yorum sayısı ≥5 ve son
// üretimden bu yana +5 eşiği geçildiyse REVIEWS_SUMMARY'i yeniden üretip
// otomatik yayınlar (admin onayı gerekmez — bkz. proje kararı).
export async function checkAndRegenerateReviewsSummary(productId: number): Promise<void> {
  const [publishedCount, existing] = await Promise.all([
    prisma.review.count({ where: { productId, status: "PUBLISHED" } }),
    prisma.aiVehicleSummary.findUnique({ where: { productId } }),
  ]);

  if (publishedCount < REVIEWS_SUMMARY_THRESHOLD) return;

  const currentThreshold = Math.floor(publishedCount / REVIEWS_SUMMARY_THRESHOLD) * REVIEWS_SUMMARY_THRESHOLD;
  const lastGeneratedThreshold = existing?.mode === "REVIEWS_SUMMARY" ? existing.reviewCountAtGeneration ?? 0 : 0;
  if (currentThreshold <= lastGeneratedThreshold) return;

  const [product, reviews] = await Promise.all([
    prisma.product.findUnique({
      where: { id: productId },
      select: {
        name: true, trimName: true, year: true,
        brand: { select: { name: true } },
        model: { select: { name: true } },
      },
    }),
    prisma.review.findMany({
      where: { productId, status: "PUBLISHED" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { summaryText: true, detailText: true },
    }),
  ]);
  if (!product || reviews.length === 0) return;

  const vehicleName = productDisplayName(product);
  const reviewsText = reviews
    .map((r) => `- ${r.summaryText}${r.detailText ? ` ${r.detailText}` : ""}`)
    .join("\n")
    .slice(0, 6000);

  const prompt = REVIEWS_SUMMARY_SYSTEM_PROMPT.replace("{VEHICLE}", vehicleName).replace("{REVIEWS}", reviewsText);
  const summaryText = await safeGenerate(prompt);
  if (!summaryText) return;

  await prisma.aiVehicleSummary.upsert({
    where: { productId },
    create: {
      productId,
      mode: "REVIEWS_SUMMARY",
      status: "APPROVED",
      summaryText,
      reviewCountAtGeneration: currentThreshold,
      modelVersion: currentGeminiModelVersion(),
      approvedAt: new Date(),
    },
    update: {
      mode: "REVIEWS_SUMMARY",
      status: "APPROVED",
      summaryText,
      reviewCountAtGeneration: currentThreshold,
      modelVersion: currentGeminiModelVersion(),
      generatedAt: new Date(),
      approvedAt: new Date(),
      approvedByUserId: null,
      rejectedAt: null,
      rejectionReason: null,
    },
  });
}
