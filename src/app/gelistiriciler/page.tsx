import type { Metadata } from "next";
import Link from "next/link";
import { BASE_URL } from "@/lib/baseUrl";
import { CopyButton } from "./CopyButton";
import { TryItWidget } from "./TryItWidget";
import { EXAMPLE_SLUG } from "./constants";
import { HashDetailsOpener } from "./HashDetailsOpener";

export const metadata: Metadata = {
  title: "Araç Güven Skoru API'si — Geliştiriciler",
  description:
    "fikape araç güven skorunu (FI·KA·PE) kendi sitenize gömmek için ücretsiz, anahtarsız API ve gömülebilir rozet. Bayi ve oto blogları için hazır entegrasyon.",
};

// `a` — JSON-LD (FAQPage) için düz metin, arama motoru bunu okur.
// `id` — sayfa içi bağlantı hedefi (örn. RESPONSE_FIELDS'teki "bkz. SSS" linki).
const FAQ_ITEMS = [
  {
    id: "sss-score-null",
    q: "Score alanı neden null dönüyor?",
    a: "Bir aracın henüz yeterli sayıda yorumu yoksa sahte/erken bir skor göstermemek için score null döner, scoreLabel de \"Veri birikiyor\" yazar. Yorum sayısı arttıkça otomatik olarak gerçek değere döner.",
  },
  {
    id: "sss-rate-limit",
    q: "Rate limit'i aşarsam ne olur?",
    a: "429 durum koduyla bir hata mesajı dönersiniz. Yanıttaki Retry-After header'ı kaç saniye sonra tekrar deneyebileceğinizi söyler; X-RateLimit-Remaining header'ı da kalan hakkınızı gösterir.",
  },
  {
    id: "sss-guncelleme-sikligi",
    q: "Veri ne sıklıkla güncelleniyor?",
    a: "Skor, o an yayında olan yorumların canlı ortalamasıdır — önbelleğe alınmaz, her istekte yeniden hesaplanır. Kendi tarafınızda gösterirken makul bir önbellek süresi (örn. birkaç saat) kullanmanızı öneririz.",
  },
  {
    id: "sss-rozet-css",
    q: "Rozeti kendi CSS'imle özelleştirebilir miyim?",
    a: "Rozet sabit boyutlu bir PNG görseli olarak üretiliyor, CSS ile içeriği değiştirilemez. Kendi tasarımınızı istiyorsanız JSON uç noktasını kullanıp skoru kendi arayüzünüzde gösterebilirsiniz.",
  },
  {
    id: "sss-api-anahtari",
    q: "API anahtarı almam gerekiyor mu, ticari kullanım serbest mi?",
    a: "Hayır, anahtar/kayıt gerekmez. Ticari sitelerde (bayi, blog, karşılaştırma sitesi) kullanmak serbest — tek şart, aşağıdaki attribution kuralına uymanız.",
  },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_ITEMS.map((item) => ({
    "@type": "Question",
    name: item.q,
    acceptedAnswer: { "@type": "Answer", text: item.a },
  })),
};

function CodeBlock({ code, label }: { code: string; label?: string }) {
  return (
    <div className="min-w-0">
      {label && <div className="text-xs text-gray-400 mb-1">{label}</div>}
      <div className="relative min-w-0">
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 pr-16 overflow-x-auto text-xs">{code}</pre>
        <CopyButton text={code} />
      </div>
    </div>
  );
}

const EXAMPLE_RESPONSE = `{
  "product": "Toyota Corolla 2023",
  "category": "Otomobil",
  "score": 8.2,
  "scoreLabel": "8.2/10",
  "reviewCount": 12,
  "url": "https://fikape.com/araclar/toyota-corolla-2023",
  "badgeUrl": "https://fikape.com/api/public/skor/toyota-corolla-2023/badge.png",
  "attribution": "Veri fikape.com kullanıcı yorumlarına dayanır...",
  "generatedAt": "2026-07-06T12:00:00.000Z"
}`;

const RESPONSE_FIELDS: { field: string; desc: string }[] = [
  { field: "product", desc: "Marka, model, yıl ve varsa donanım paketi ile tam araç adı." },
  { field: "category", desc: "Araç kategorisi (Otomobil, Motosiklet, vb.) — kategorisizse null." },
  { field: "score", desc: "0-10 arası ortalama skor. Yeterli yorum yoksa null döner." },
  { field: "scoreLabel", desc: "Gösterime hazır etiket — score null ise \"Veri birikiyor\" yazar." },
  { field: "reviewCount", desc: "Skora dahil edilen yayınlanmış yorum sayısı." },
  { field: "url", desc: "Aracın fikape üzerindeki sayfası — attribution linki için kullanın." },
  { field: "badgeUrl", desc: "Aynı aracın gömülebilir rozet görselinin adresi (PNG)." },
  { field: "attribution", desc: "Veriyi kullanırken gösterilmesi gereken kaynak metni." },
  { field: "generatedAt", desc: "Yanıtın üretildiği an (ISO 8601) — önbellekleme kararınız için." },
];

const ERROR_ROWS: { status: string; when: string; body: string }[] = [
  { status: "404", when: "Slug'a ait aktif bir araç bulunamadı.", body: `{ "error": "Araç bulunamadı" }` },
  {
    status: "429",
    when: "IP başına dakikada izin verilen 30 istek sınırı aşıldı. Retry-After header'ı saniye cinsinden bekleme süresini verir.",
    body: `{ "error": "Çok fazla istek. Lütfen biraz yavaşlayın." }`,
  },
  {
    status: "500",
    when: "Beklenmeyen bir sunucu hatası oluştu (iç detay response'a yazılmaz, sadece sunucuda loglanır).",
    body: `{ "error": "Sunucu hatası, lütfen daha sonra tekrar deneyin." }`,
  },
];

export default function DevelopersPage() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />
      <HashDetailsOpener />

      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Araç Güven Skoru API&apos;si</h1>
      <p className="text-sm text-gray-500 mb-4 max-w-2xl">
        Bir aracın fikape kullanıcı yorumlarına dayalı FI·KA·PE skorunu kendi sitenizde göstermek
        için ücretsiz, anahtarsız, salt-okunur API ve gömülebilir rozet görseli. Bayi sitelerinde,
        oto bloglarında ve karşılaştırma sayfalarında kullanabilirsiniz.
      </p>
      <ol className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-400 mb-10 list-decimal list-inside">
        <li>Slug&apos;u biliyorsan JSON uç noktasını çağır</li>
        <li>Skoru kendi arayüzünde göster ya da rozeti göm</li>
        <li>Araç sayfasına link ver — tek şart bu</li>
      </ol>

      <div className="space-y-10 text-sm text-gray-600">
        <section id="canli-dene" className="min-w-0 scroll-mt-24">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Canlı Dene</h2>
          <TryItWidget />
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">JSON uç noktası</h2>
          <div className="space-y-3">
            <CodeBlock label="İstek" code={`GET ${BASE_URL}/api/public/skor/{arac-slug}`} />
            <CodeBlock label="curl örneği" code={`curl ${BASE_URL}/api/public/skor/${EXAMPLE_SLUG}`} />
            <CodeBlock label="Örnek yanıt" code={EXAMPLE_RESPONSE} />
          </div>

          <div className="mt-4 border border-gray-100 rounded-xl overflow-hidden min-w-0">
            <table className="w-full text-xs">
              <tbody>
                {RESPONSE_FIELDS.map((f) => (
                  <tr key={f.field} className="border-t border-gray-100 first:border-t-0">
                    <td className="align-top px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{f.field}</td>
                    <td className="align-top px-3 py-2 text-gray-500">
                      {f.desc}
                      {f.field === "score" && (
                        <>
                          {" "}
                          (<a href="#sss-score-null" className="underline hover:text-gray-700">bkz. SSS</a>)
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="mt-2 text-xs text-gray-400">
            Tarayıcıdan doğrudan çağrılabilir (CORS açık, <code>Access-Control-Allow-Origin: *</code>) —
            sunucu tarafında proxy&apos;lemenize gerek yok.
          </p>
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Gömülebilir rozet</h2>
          <p className="mb-3">Gerçek bir örnek üzerinde şöyle görünür:</p>

          <div className="border border-gray-100 bg-gray-50 rounded-xl p-4 mb-3 min-w-0">
            <div className="flex flex-wrap items-center gap-3 min-w-0">
              <div className="flex-1 min-w-0 bg-white border border-gray-200 rounded-lg p-3">
                <div className="text-xs text-gray-400 mb-1">2020 Citroen C5 Aircross 1.6 PureTech Shine</div>
                <div className="text-sm font-semibold text-gray-800 truncate">Sahibinden temiz, bakımlı araç</div>
              </div>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/api/public/skor/${EXAMPLE_SLUG}/badge.png`}
                width={220}
                height={64}
                alt="fikape skoru"
                className="rounded-lg shrink-0"
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Solda örnek bir ilan kartı, sağda o aracın gerçek fikape rozeti — kendi sitenizde de
              böyle görünür.
            </p>
          </div>

          <CodeBlock
            code={`<a href="${BASE_URL}/araclar/${EXAMPLE_SLUG}">
  <img src="${BASE_URL}/api/public/skor/${EXAMPLE_SLUG}/badge.png"
       width="220" height="64" alt="fikape skoru" />
</a>`}
          />
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Hata kodları</h2>
          <div className="border border-gray-100 rounded-xl overflow-x-auto">
            <table className="w-full text-xs min-w-[420px]">
              <thead>
                <tr className="bg-gray-50 text-left">
                  <th className="px-3 py-2 font-semibold text-gray-700">Durum</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Ne zaman</th>
                  <th className="px-3 py-2 font-semibold text-gray-700">Örnek gövde</th>
                </tr>
              </thead>
              <tbody>
                {ERROR_ROWS.map((row) => (
                  <tr key={row.status} className="border-t border-gray-100">
                    <td className="align-top px-3 py-2 font-mono text-gray-800 whitespace-nowrap">{row.status}</td>
                    <td className="align-top px-3 py-2 text-gray-500">{row.when}</td>
                    <td className="align-top px-3 py-2 font-mono text-gray-500 whitespace-nowrap">{row.body}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Rate limit</h2>
          <p>
            IP başına dakikada 30 istek. Her yanıtta şu header&apos;lar gelir:{" "}
            <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>,{" "}
            <code>X-RateLimit-Reset</code> (epoch saniye). Limit aşılırsa ayrıca{" "}
            <code>Retry-After</code> (saniye) header&apos;ı eklenir — bkz. yukarıdaki{" "}
            <a href="#canli-dene" className="underline hover:text-gray-700">Canlı Dene widget&apos;i</a>.
          </p>
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Sıkça sorulan sorular</h2>
          <div className="space-y-2">
            {FAQ_ITEMS.map((item) => (
              <details key={item.id} id={item.id} className="border border-gray-100 rounded-xl p-3 group">
                <summary className="text-sm font-medium text-gray-800 cursor-pointer list-none flex items-center justify-between gap-2">
                  {item.q}
                  <span className="text-gray-300 group-open:rotate-180 transition-transform shrink-0">⌄</span>
                </summary>
                <p className="mt-2 text-sm text-gray-500">
                  {item.id === "sss-api-anahtari" ? (
                    <>
                      Hayır, anahtar/kayıt gerekmez. Ticari sitelerde (bayi, blog, karşılaştırma sitesi)
                      kullanmak serbest — tek şart,{" "}
                      <a href="#attribution-kurali" className="underline hover:text-gray-700">
                        aşağıdaki attribution kuralına
                      </a>{" "}
                      uymanız.
                    </>
                  ) : (
                    item.a
                  )}
                </p>
              </details>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">Kullanırken dikkat et</h2>
          <ul className="list-disc pl-5 space-y-1.5">
            <li>Ücretsiz, API anahtarı gerekmez; dakikada IP başına 30 istek sınırı vardır.</li>
            <li id="attribution-kurali" className="scroll-mt-24">
              Rozeti veya veriyi kullanırken ilgili araç sayfasına link vermeniz gerekir (yukarıdaki
              örnekteki gibi) — bu attribution zorunlu, opsiyonel değil.
            </li>
            <li>Veri salt-okunur ve toplulaştırılmıştır; bireysel yorum içeriği API&apos;de yer almaz.</li>
            <li>
              fikape skoru hiçbir şekilde para karşılığında değiştirilemez — API&apos;de gösterilen sayı,
              sitede gösterilenle her zaman birebir aynıdır.
            </li>
            <li className="text-gray-500">
              Şu an rate limit dışında zorlayıcı bir engelleme mekanizması yok, ama kötüye kullanım
              (kural ihlali, aşırı otomatik istek) tespit edilirse erişim manuel olarak kısıtlanabilir.
            </li>
          </ul>
        </section>
      </div>
    </div>
  );
}
