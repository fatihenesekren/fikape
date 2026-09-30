import { generateGeminiText } from "@/lib/ai/gemini";
import { prisma } from "@/lib/prisma";

// Takas ilanına "yaklaşık ortalama piyasa değeri" eklemek için: Tavily ile
// gerçek ilan sitelerinde (sahibinden.com/arabam.com) arama yapıp bulunan
// GERÇEK fiyatları Gemini'ye özetletiyoruz. Bilinçli tasarım kararları:
//   - Gemini'nin kendi eğitim verisine SORULMUYOR — canlı arama yapamadığı
//     için (bkz. ai/gemini.ts) piyasadan %25-30 düşük, güncel-olmayan rakam
//     veriyordu (kullanıcıyla birlikte doğrulandı, 2026-09-30).
//   - Google Custom Search JSON API denendi ama Google yeni projelere/
//     müşterilere kapatmış (kalıcı kısıtlama, yapılandırma sorunu değil) —
//     Tavily'ye geçildi (ayda 1500 sorgu ücretsiz, kart gerekmiyor).
//   - Arama sonucu belirsiz/yetersizse (gerçek fiyat verisi yoksa) null
//     döner — asla bir rakam UYDURULMAZ (bkz. %90 güven ilkesi).
const PRICE_SITES = ["sahibinden.com", "arabam.com"];

export interface MarketPriceEstimate {
  min: number;
  max: number;
}

async function searchListingPrices(vehicleName: string): Promise<string> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) return "";

  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query: `${vehicleName} fiyat ikinci el`,
      search_depth: "advanced",
      max_results: 8,
      include_answer: true,
      include_domains: PRICE_SITES,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) return "";

  const data = (await res.json()) as {
    answer?: string;
    results?: { title?: string; content?: string }[];
  };
  const lines: string[] = [];
  if (data.answer) lines.push(data.answer);
  for (const item of data.results ?? []) {
    lines.push(`${item.title ?? ""}: ${(item.content ?? "").slice(0, 300)}`);
  }
  return lines.join("\n");
}

const EXTRACT_PROMPT = `Aşağıda ikinci el bir aracın Türkiye'deki ilan sitelerinden toplanmış arama sonuçları var. Bu sonuçlara dayanarak aracın GÜNCEL, GERÇEKÇİ bir fiyat aralığını TL cinsinden tahmin et.

Kurallar:
- Yalnızca arama sonuçlarında GEÇEN gerçek fiyatlara dayan, kendi bilgini/tahminini KULLANMA.
- Sonuçlarda bu araca (marka/model/donanım) ait anlamlı sayıda gerçek fiyat yoksa "BELİRSİZ" yaz, uydurma bir rakam verme.
- Cevabı SADECE şu formatta ver, başka hiçbir açıklama/birim/nokta ekleme: "MIN-MAX" (ör. 1550000-1850000) ya da "BELİRSİZ".

Araç: {VEHICLE}

Arama sonuçları:
{RESULTS}`;

export function parsePriceRange(raw: string): MarketPriceEstimate | null {
  const match = raw.trim().match(/^(\d+)\s*-\s*(\d+)$/);
  if (!match) return null;
  const min = Number(match[1]);
  const max = Number(match[2]);
  if (!Number.isFinite(min) || !Number.isFinite(max) || min <= 0 || max < min) return null;
  return { min, max };
}

export async function estimateMarketPrice(
  brand: string,
  model: string,
  trim: string | null,
  year: number | null,
): Promise<MarketPriceEstimate | null> {
  if (!process.env.TAVILY_API_KEY) return null;

  const vehicleName = [brand, model, trim, year].filter(Boolean).join(" ");
  const searchText = await searchListingPrices(vehicleName).catch(() => "");
  if (!searchText.trim()) return null;

  const prompt = EXTRACT_PROMPT.replace("{VEHICLE}", vehicleName).replace("{RESULTS}", searchText.slice(0, 6000));

  try {
    const raw = await generateGeminiText(prompt);
    return parsePriceRange(raw);
  } catch {
    return null;
  }
}

/**
 * İlan oluşturma/yeniden açma sırasında response'u bekletmeden (await
 * EDİLMEDEN) çağrılır — notifyAdmins/createNotification ile aynı "arka plan"
 * deseni. Sonuç birkaç saniye içinde DB'ye yazılır; hata olursa sadece loglanır,
 * ilan işlemini asla etkilemez.
 */
export function scheduleMarketPriceUpdate(
  listingId: number,
  brand: string,
  model: string,
  trim: string | null,
  year: number | null,
): void {
  estimateMarketPrice(brand, model, trim, year)
    .then((estimate) => {
      if (!estimate) return;
      return prisma.tradeListing.update({
        where: { id: listingId },
        data: { marketPriceMin: estimate.min, marketPriceMax: estimate.max, marketPriceEstimatedAt: new Date() },
      });
    })
    .catch((e) => console.error("[market-price]", e));
}
