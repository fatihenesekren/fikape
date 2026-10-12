// Tavily ile kırılım başına web araması (marketPrice.ts ile aynı sağlayıcı/anahtar).
import type { AramaSonucu } from "./cikarim";
import { MEDYA_B } from "./kaynak";

const SONUC_BASINA = 8;

async function tavily(query: string, haber: boolean, medyaKisitli: boolean): Promise<AramaSonucu[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) throw new Error("TAVILY_API_KEY tanımlı değil.");
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: apiKey,
      query,
      search_depth: "advanced",
      max_results: SONUC_BASINA,
      include_answer: false,
      ...(haber ? { topic: "news", days: 75 } : {}),
      // Yalnız bilinen yayınlarda ara: gürültü (video, sosyal medya) yerine B kademesi kaynak gelir
      ...(medyaKisitli ? { include_domains: [...MEDYA_B] } : {}),
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`Tavily hatası (${res.status})`);
  const data = (await res.json()) as { results?: { title?: string; url?: string; content?: string }[] };
  return (data.results ?? [])
    .filter((r): r is { title?: string; url: string; content?: string } => typeof r.url === "string" && r.url.length > 0)
    .map((r) => ({ title: r.title ?? "", url: r.url, content: r.content ?? "" }));
}

/** Sorguları paralel çalıştırır, URL'ye göre tekilleştirir. Biri çökerse diğeri yine kullanılır. */
export async function kirilimAra(sorgular: string[], opts: { medyaKisitli?: boolean } = {}): Promise<AramaSonucu[]> {
  // İlk sorgu haber araması; kısıtlıysa bilinen yayınlarla sınırlanır, diğer sorgu serbest kalır (resmî marka sayfaları için)
  const sonuclar = await Promise.allSettled(sorgular.map((q, i) => tavily(q, i === 0, i === 0 && !!opts.medyaKisitli)));
  if (sonuclar.every((s) => s.status === "rejected")) {
    throw (sonuclar[0] as PromiseRejectedResult).reason;
  }
  const gorulen = new Set<string>();
  const cikti: AramaSonucu[] = [];
  for (const s of sonuclar) {
    if (s.status !== "fulfilled") continue;
    for (const r of s.value) {
      if (gorulen.has(r.url)) continue;
      gorulen.add(r.url);
      cikti.push(r);
    }
  }
  return cikti;
}
