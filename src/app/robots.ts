import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/baseUrl";

// /admin ve /api taranmaz. Herkese açık skor API'si/rozeti (gömülen dış siteler ve paylaşım önizleme botları için) açık kalır.
// Not: noindex'li sayfalar (giriş, kayıt, profil…) bilinçli olarak Disallow EDİLMİYOR — botların noindex etiketini okuyabilmesi gerekir.
// Bot'a özel gruplar "*" grubunu miras almaz; bu yüzden aynı kurallar her grupta tekrarlanır.
const ALLOW = ["/", "/api/public/"];
const DISALLOW = ["/admin/", "/api/"];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: ALLOW, disallow: DISALLOW },
      // AI arama/asistan bot'larına açık izin — GEO (2026 arama keşfedilebilirliği)
      { userAgent: "GPTBot", allow: ALLOW, disallow: DISALLOW },
      { userAgent: "ClaudeBot", allow: ALLOW, disallow: DISALLOW },
      { userAgent: "anthropic-ai", allow: ALLOW, disallow: DISALLOW },
      { userAgent: "PerplexityBot", allow: ALLOW, disallow: DISALLOW },
      { userAgent: "Google-Extended", allow: ALLOW, disallow: DISALLOW },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
