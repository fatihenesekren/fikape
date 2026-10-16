import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { capraziSiteApiIstegiMi } from "@/lib/ayniKaynak";
import { cspOlustur } from "@/lib/csp";
import { ownBlobHost } from "@/lib/blobUrl";

// Sayfa istekleri için nonce'lu aday CSP (şimdilik YALNIZ RAPOR). Next.js nonce'u istek başlığındaki politikadan okuyup kendi
// scriptlerine ekler; layout satır içi script için x-nonce'u kullanır. Zorlanan politika next.config.ts'tedir (değişmedi).
function nonceliSonraki(req: NextRequest): NextResponse {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const politika = cspOlustur({
    nonce,
    uretim: process.env.NODE_ENV === "production",
    onizleme: process.env.VERCEL_ENV === "preview",
    blobHost: ownBlobHost() ?? "*.public.blob.vercel-storage.com",
  });
  const istekBasliklari = new Headers(req.headers);
  istekBasliklari.set("x-nonce", nonce);
  istekBasliklari.set("content-security-policy-report-only", politika);
  // Next nonce'u istek başlığındaki politikadan okur. Canlıda (Vercel) report-only adlı istek başlığı Next'e ulaşmıyor, yalnız
  // x-nonce ulaşıyordu (Next'in kendi scriptleri nonce'suz çıkıyordu). Aynı politika iç istek başlığı olarak `content-security-policy`
  // adıyla da verilir; bu başlık tarayıcıya GİTMEZ (yanıttaki zorlanan politika next.config.ts'te, değişmedi).
  istekBasliklari.set("content-security-policy", politika);
  const res = NextResponse.next({ request: { headers: istekBasliklari } });
  res.headers.set("Content-Security-Policy-Report-Only", politika);
  return res;
}

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Tüm durum değiştiren /api istekleri (admin dahil) için aynı-site doğrulaması: oturum çerezi SameSite=Lax'tır, bu kontrol
  // ek bir CSRF katmanıdır (Sec-Fetch-Site / Origin). Her admin route'unun kendi kontrolüne güvenmek yerine tek noktada uygulanır.
  if (pathname.startsWith("/api/")) {
    if (capraziSiteApiIstegiMi(req, pathname)) {
      return NextResponse.json({ error: "Geçersiz istek kaynağı." }, { status: 403 });
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/yorum-yaz")) {
    const session = await auth();
    if (!session) {
      const giris = new URL("/giris", req.url);
      giris.searchParams.set("callbackUrl", req.nextUrl.pathname);
      return NextResponse.redirect(giris);
    }
  }
  return nonceliSonraki(req);
}

export const config = {
  matcher: [
    "/api/:path*",
    // Sayfa istekleri: statik dosyalar/görseller ve Next prefetch istekleri hariç (prefetch'te nonce gereksiz).
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
