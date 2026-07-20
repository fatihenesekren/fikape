import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Geliştiriciler için Skor API'si",
  description:
    "fikape araç skorlarını kendi sitenize gömmek için ücretsiz, salt-okunur API ve rozet görseli.",
};

export default function DevelopersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Geliştiriciler için Skor API&apos;si</h1>
      <p className="text-sm text-gray-500 mb-10">
        Bir aracın fikape kullanıcı yorumlarına dayalı FI·KA·PE skorunu kendi sitenizde
        göstermek için ücretsiz, salt-okunur API ve gömülebilir rozet görseli.
      </p>

      <div className="space-y-8 text-sm text-gray-600">
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">JSON uç noktası</h2>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
GET https://fikape.com/api/public/skor/&#123;arac-slug&#125;
          </pre>
          <p className="mt-2">
            Örnek yanıt:
          </p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
{`{
  "product": "Toyota Corolla 2023",
  "category": "Otomobil",
  "score": 8.2,
  "scoreLabel": "8.2/10",
  "reviewCount": 12,
  "url": "https://fikape.com/araclar/toyota-corolla-2023",
  "badgeUrl": "https://fikape.com/api/public/skor/toyota-corolla-2023/badge.png",
  "attribution": "Veri fikape.com kullanıcı yorumlarına dayanır...",
  "generatedAt": "2026-07-06T12:00:00.000Z"
}`}
          </pre>
          <p className="mt-2">
            Henüz yeterli yorumu olmayan araçlarda <code>score</code> alanı <code>null</code> döner,
            <code> scoreLabel</code> &quot;Veri birikiyor&quot; gösterir — sahte/erken veri sunmamak için.
          </p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Gömülebilir rozet</h2>
          <p className="mb-2">Sitenize koymak için:</p>
          <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto text-xs">
{`<a href="https://fikape.com/araclar/toyota-corolla-2023">
  <img src="https://fikape.com/api/public/skor/toyota-corolla-2023/badge.png"
       width="220" height="64" alt="fikape skoru" />
</a>`}
          </pre>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kurallar</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Ücretsiz, API anahtarı gerekmez, dakikada 30 istek IP başına sınırı vardır.</li>
            <li>Rozeti veya veriyi kullanırken ilgili araç sayfasına link vermeniz gerekir (yukarıdaki örnekteki gibi).</li>
            <li>Veri salt-okunur ve toplulaştırılmıştır; bireysel yorum içeriği API&apos;de yer almaz.</li>
            <li>fikape skoru hiçbir şekilde para karşılığı değiştirilemez — API&apos;de gösterilen sayı, sitede gösterilenle her zaman birebir aynıdır.</li>
          </ul>
        </section>
      </div>
    </div>
  );
}
