import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { capraziSiteApiIstegiMi } from "@/lib/ayniKaynak";

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

  const session = await auth();
  if (!session) {
    const giris = new URL("/giris", req.url);
    giris.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(giris);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/yorum-yaz/:path*", "/api/:path*"],
};
