import { getAracHavuzu } from "@/lib/aracHavuzu";
import { quizAlanlariniKirp, type QuizHavuzUrunu } from "@/lib/quiz";

/**
 * "Araç Bul" kartı için hafif ürün havuzu: kategori + yalnız kuralların okuduğu özellikler.
 * Kaynak, /araclar havuzuyla aynı önbelleklenmiş sorgudur (ek veritabanı yükü yok).
 */
export async function getQuizHavuzu(): Promise<QuizHavuzUrunu[]> {
  const urunler = await getAracHavuzu();
  return urunler.map((p) => ({ c: p.category?.slug ?? "", a: quizAlanlariniKirp(p.attributes as Record<string, unknown>) }));
}
