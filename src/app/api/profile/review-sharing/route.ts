import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { kullaniciLimiti } from "@/lib/userRateLimit";
import { recordReviewSharingConsent } from "@/lib/reviewSharingConsent";

// Yorum paylaşım rızasını verir / geri çeker. Her karar ConsentLog'a ayrı satır olarak yazılır.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  const limitYaniti = await kullaniciLimiti(session, "profile-review-sharing", 30, 60 * 60 * 1000);
  if (limitYaniti) return limitYaniti;
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Giriş gerekli" }, { status: 401 });
  }

  const { enabled } = (await req.json().catch(() => null)) ?? {};
  if (typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Geçersiz istek" }, { status: 400 });
  }

  try {
    await recordReviewSharingConsent(Number(session.user.id), enabled, req);
  } catch {
    return NextResponse.json({ error: "Tercihiniz kaydedilemedi, lütfen tekrar deneyin." }, { status: 500 });
  }

  return NextResponse.json({ ok: true, enabled });
}
