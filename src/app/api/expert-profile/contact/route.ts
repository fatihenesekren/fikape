import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { checkContent } from "@/lib/reviewValidation";
import { logContentFilterHit } from "@/lib/contentFilterLog";
import { expertContactUpdateSchema, formatZodError } from "@/lib/schemas";
import { recordConsent, getLatestConsent } from "@/lib/consent";

// Usta iletişim/görünürlük ayarları — self-servis. Granüler rıza (§7):
// - (b) EXPERT_CONTACT_PUBLIC: açık telefon/adresin herkese açık yayını.
//   Reddedilir/geri çekilirse contactPhone/contactAddress DERHAL silinir
//   (bekletme yok — "geri çekmede derhal kaldırma", saklama süresi değil).
// - (c) EXPERT_REGIONAL_PROMO: bölgesel görünürlük (mekanizma Aşama 9'da).
// Her karar (ver/geri çek) ConsentLog'a AYRI satır olarak yazılır — ispat yükü.
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Giriş gerekli." }, { status: 401 });
  const userId = parseInt(session.user.id);

  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { id: true, status: true, contactVisible: true },
  });
  if (!profile || profile.status !== "ACTIVE") {
    return NextResponse.json({ error: "Yalnızca aktif ustalar bu ayarları değiştirebilir." }, { status: 403 });
  }

  const parsed = expertContactUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: formatZodError(parsed.error) }, { status: 400 });
  }
  const { consentContactPublic, consentRegionalPromo, cvNoindex } = parsed.data;
  const businessName = parsed.data.businessName?.trim() || null;
  const contactPhone = parsed.data.contactPhone?.trim() || null;
  const contactAddress = parsed.data.contactAddress?.trim() || null;

  for (const text of [businessName, contactAddress]) {
    if (!text) continue;
    const contentCheck = checkContent(text);
    if (!contentCheck.ok) {
      logContentFilterHit({ userId, surface: "EXPERT_NOTE", rule: contentCheck.rule });
      return NextResponse.json({ error: contentCheck.error }, { status: 400 });
    }
  }

  // (b) rızası yoksa iletişim bilgisi DERHAL temizlenir ve gösterilmez —
  // rıza olsa bile hiçbir alan girilmemişse de gösterilecek bir şey yok.
  const contactVisible = consentContactPublic && (!!businessName || !!contactPhone || !!contactAddress);

  await prisma.expertProfile.update({
    where: { id: profile.id },
    data: {
      businessName: consentContactPublic ? businessName : null,
      contactPhone: consentContactPublic ? contactPhone : null,
      contactAddress: consentContactPublic ? contactAddress : null,
      contactVisible,
      cvNoindex,
    },
  });

  // Rıza geçmişi — yalnızca bir önceki karardan farklıysa yeni satır (gereksiz spam önlenir)
  const [lastContact, lastRegional] = await Promise.all([
    getLatestConsent(userId, "EXPERT_CONTACT_PUBLIC"),
    getLatestConsent(userId, "EXPERT_REGIONAL_PROMO"),
  ]);
  if (lastContact !== consentContactPublic) {
    await recordConsent({ userId, consentType: "EXPERT_CONTACT_PUBLIC", isGranted: consentContactPublic, req });
  }
  if (lastRegional !== consentRegionalPromo) {
    await recordConsent({ userId, consentType: "EXPERT_REGIONAL_PROMO", isGranted: consentRegionalPromo, req });
  }

  return NextResponse.json({ ok: true, contactVisible });
}
