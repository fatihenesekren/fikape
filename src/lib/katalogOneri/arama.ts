// Tavily ile kırılım başına web araması (marketPrice.ts ile aynı sağlayıcı/anahtar).
import type { AramaSonucu } from "./cikarim";

const SONUC_BASINA = 8;

async function tavily(query: string, haber: boolean): Promise<AramaSonucu[]> {
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
export async function kirilimAra(sorgular: string[]): Promise<AramaSonucu[]> {
  const sonuclar = await Promise.allSettled(sorgular.map((q, i) => tavily(q, i === 0)));
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
