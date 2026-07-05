import { BASE_URL } from "@/lib/baseUrl";

export async function GET() {
  const body = `# fikape

> Türkiye'nin araç yorum platformu. Gerçek kullanıcıların Fiyat, Kalite ve Performans (FI·KA·PE) puanlarıyla verdiği araç deneyimleri.

fikape'de her yorum e-posta doğrulanmış bir kullanıcıya ait, moderasyondan geçer ve puanlar asla parayla etkilenmez.

## Önemli sayfalar

- [Nasıl Çalışır](${BASE_URL}/nasil-calisir): Puanlama metodolojisi, güven seviyeleri (TrustLevel) ve moderasyon kuralları
- [Arama](${BASE_URL}/arama): Araç arama
- [Gizlilik Politikası](${BASE_URL}/gizlilik)
- [Kullanım Koşulları](${BASE_URL}/kullanim-kosullari)

## Notlar

- Her araç sayfası (${BASE_URL}/araclar/[slug]) schema.org Product + AggregateRating + Review JSON-LD içerir.
- Puanlar 1-10 ölçeğinde, FI×0.30 + KA×0.35 + PE×0.35 ağırlıklı ortalamasıyla hesaplanır.
`;

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
