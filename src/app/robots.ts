import type { MetadataRoute } from "next";
import { BASE_URL } from "@/lib/baseUrl";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: "*", allow: "/" },
      // AI arama/asistan bot'larına açık izin — GEO (2026 arama keşfedilebilirliği)
      { userAgent: "GPTBot", allow: "/" },
      { userAgent: "ClaudeBot", allow: "/" },
      { userAgent: "anthropic-ai", allow: "/" },
      { userAgent: "PerplexityBot", allow: "/" },
      { userAgent: "Google-Extended", allow: "/" },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
