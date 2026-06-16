import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function proxy(req: NextRequest) {
  const session = await auth();
  if (!session) {
    const giris = new URL("/giris", req.url);
    giris.searchParams.set("callbackUrl", req.nextUrl.pathname);
    return NextResponse.redirect(giris);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/yorum-yaz/:path*"],
};
