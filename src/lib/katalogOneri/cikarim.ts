// Arama sonuçlarından aday çıkarımı. Gemini YALNIZCA verilen metinden çıkarır; kaynak URL'sini modelin
// yazmasına izin vermeyiz (kaynakNo → aramadan gelen gerçek URL). Çıktı ayrıca kodla doğrulanır:
// alıntı gerçekten kaynakta geçmeli, marka+model kaynakta geçmeli, Türkiye'ye işaret olmalı, kademe C ise elenir.
import { z } from "zod";
import { adAnahtar } from "@/lib/katalog/ek";
import { generateGeminiJson } from "@/lib/ai/gemini";
import { kaynakAdi, kaynakKademe, turkiyeKaniti, type Kademe } from "./kaynak";
import type { Kirilim } from "./kirilimlar";

export interface AramaSonucu {
  title: string;
  url: string;
  content: string;
}

export interface AdayHam {
  marka: string;
  model: string;
  versiyon: string | null;
  yil: number | null;
  tarihNotu: string | null;
  kaynakUrl: string;
  kaynakAdi: string | null;
  kademe: Kademe;
  kanit: string;
}

/** Karşılaştırma için: küçük harf, aksansız, noktalama → boşluk. */
export function norm(s: string): string {
  return s
    .replace(/İ/g, "i").replace(/I/g, "ı")
    .toLowerCase()
    .replace(/ı/g, "i").replace(/ğ/g, "g").replace(/ü/g, "u").replace(/ş/g, "s").replace(/ö/g, "o").replace(/ç/g, "c")
    .normalize("NFD").replace(/\p{Mn}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

const SATIR = z.object({
  marka: z.string().trim().min(1).max(80),
  model: z.string().trim().min(1).max(100),
  versiyon: z.string().trim().max(100).nullish(),
  yil: z.number().int().min(2024).max(2030).nullish(),
  tarihNotu: z.string().trim().max(60).nullish(),
  kaynakNo: z.number().int().min(0),
  kanit: z.string().trim().min(12).max(200),
});
const CIKTI = z.array(SATIR).max(10);

const AZAMI_KAYNAK = 10;
const KAYNAK_KARAKTER = 1100;

export function istemHazirla(k: Kirilim, kaynaklar: AramaSonucu[]): string {
  const metin = kaynaklar
    .map((s, i) => `[${i}] ${s.title}\n${s.content.slice(0, KAYNAK_KARAKTER)}`)
    .join("\n\n");
  return `Aşağıda internetten toplanmış numaralı kaynak metinleri var. Görevin: bu metinlerde TÜRKİYE'DE satışa çıkmış ya da çıkacağı açıkça yazılan, "${k.tanim}" kapsamındaki YENİ araç modellerini listelemek.

Kurallar:
- YALNIZCA kaynak metinlerde yazan bilgiyi kullan. Kendi bilgini ekleme, tahmin etme, uydurma.
- Aracın Türkiye'de satışa çıktığı/çıkacağı kaynakta açıkça geçmiyorsa (yalnız küresel tanıtımsa) listeye ALMA.
- Kapsam dışı araçları (başka tür araçlar) alma.
- "kanit" alanı, kaynak metinden KELİMESİ KELİMESİNE kopyalanmış, 200 karakteri geçmeyen bir cümle parçası olmalı ve aracın adını içermeli.
- "kaynakNo" aracın geçtiği kaynağın numarasıdır. URL yazma.
- "yil" model yılı (kaynakta yoksa null), "tarihNotu" satış tarihi ifadesi (örn. "Kasım 2026", "satışta"; yoksa null).
- En fazla 4 araç ver. Hiç uygun araç yoksa boş liste [] döndür.

Cevap yalnızca şu biçimde bir JSON dizisi olsun:
[{"marka":"","model":"","versiyon":null,"yil":null,"tarihNotu":null,"kaynakNo":0,"kanit":""}]

Kaynaklar:
${metin}`;
}

/** Gemini çıktısını doğrular ve kaynağa karşı denetler; güvenilmeyen satırı sessizce eler. */
export function adaylariDogrula(ham: unknown, kaynaklar: AramaSonucu[], k: Kirilim): AdayHam[] {
  const p = CIKTI.safeParse(ham);
  if (!p.success) return [];
  const cikti: AdayHam[] = [];
  for (const s of p.data) {
    const kaynak = kaynaklar[s.kaynakNo];
    if (!kaynak) continue;

    const metinNorm = norm(`${kaynak.title} ${kaynak.content.slice(0, KAYNAK_KARAKTER)}`);
    // Alıntı gerçekten kaynakta geçiyor mu?
    const kanitNorm = norm(s.kanit);
    if (kanitNorm.length < 10 || !metinNorm.includes(kanitNorm)) continue;
    // Marka ve model kaynakta geçiyor mu? (boşluksuz anahtarla: "C-HR" = "c hr")
    const metinAnahtar = metinNorm.replace(/ /g, "");
    if (!metinAnahtar.includes(norm(s.marka).replace(/ /g, "")) || !metinAnahtar.includes(norm(s.model).replace(/ /g, ""))) continue;
    if (!turkiyeKaniti(kaynak.url, metinNorm)) continue;

    const kademe = kaynakKademe(kaynak.url, s.marka);
    if (!kademe) continue;
    if (k.sadeceResmi && kademe !== "A") continue;

    cikti.push({
      marka: s.marka, model: s.model, versiyon: s.versiyon || null, yil: s.yil ?? null,
      tarihNotu: s.tarihNotu || null, kaynakUrl: kaynak.url, kaynakAdi: kaynakAdi(kaynak.url),
      kademe, kanit: s.kanit,
    });
  }
  return cikti;
}

/** Aramadan aday çıkar. Gemini hatası ya da boş sonuç → [] (çağıran hata sayar). */
export async function adayCikar(k: Kirilim, kaynaklar: AramaSonucu[]): Promise<AdayHam[]> {
  const secili = kaynaklar.slice(0, AZAMI_KAYNAK);
  if (secili.length === 0) return [];
  const ham = await generateGeminiJson(istemHazirla(k, secili));
  return adaylariDogrula(ham, secili, k);
}

/** Aynı marka+modeli tek satıra indirir; A kademesi B'ye üstün gelir. */
export function adaylariBirlestir(adaylar: AdayHam[]): AdayHam[] {
  const harita = new Map<string, AdayHam>();
  for (const a of adaylar) {
    const key = adAnahtar(`${a.marka} ${a.model}`);
    const eski = harita.get(key);
    if (!eski || (eski.kademe === "B" && a.kademe === "A")) harita.set(key, a);
  }
  return [...harita.values()];
}
