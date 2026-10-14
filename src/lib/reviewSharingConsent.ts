import { prisma } from "@/lib/prisma";
import { hashRequestContext } from "@/lib/security";

// Yorum metninin/puanlarının adsız olarak API ile iş ortaklarına sunulmasına İSTEĞE BAĞLI açık rıza.
// Üyelik bu rızaya bağlı değildir; kayıtta işaretsiz kutu, profil ayarından sonradan verilir/geri çekilir.
// ConsentLog append-only: her karar (ver/geri çek) ayrı satır, en güncel olan geçerlidir.
// Rıza metni (kayıt kutusu + gizlilik sayfası) değişince sürüm artırılmalıdır.
export const REVIEW_SHARING_CONSENT_VERSION = "v1-2026-10";

/** Son karar: true/false; hiç sorulmamışsa null. Enum DB'ye henüz eklenmemişse null döner (sayfa kırılmasın). */
export async function getReviewSharingConsent(userId: number): Promise<boolean | null> {
  try {
    const last = await prisma.consentLog.findFirst({
      where: { userId, consentType: "REVIEW_DATA_SHARING" },
      orderBy: { createdAt: "desc" },
      select: { isGranted: true },
    });
    return last?.isGranted ?? null;
  } catch {
    return null;
  }
}

/** Kararı kaydeder. KVKK: ham IP/UA yerine hash yazılır (bkz. lib/security.ts). */
export async function recordReviewSharingConsent(userId: number, isGranted: boolean, req: Request): Promise<void> {
  const { ipHash, userAgentHash } = hashRequestContext(req);
  await prisma.consentLog.create({
    data: {
      userId,
      consentType: "REVIEW_DATA_SHARING",
      isGranted,
      consentVersion: REVIEW_SHARING_CONSENT_VERSION,
      ipAddress: ipHash,
      userAgent: userAgentHash,
    },
  });
}
