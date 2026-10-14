import { prisma } from "@/lib/prisma";
import { hashRequestContext } from "@/lib/security";
import { decryptPhone, displayPhone, maskedPhone } from "@/lib/phoneShareCrypto";

// Takas görüşmesinde karşılıklı telefon paylaşımı — görünürlük kuralı TEK yerde.
// Numara yalnızca: görüşme açık (kapalı/engelli değil), ilan aktif, çift arasında kullanıcı bloğu yok VE
// iki taraf da paylaşmışsa karşı tarafa çözülüp döner. Aksi halde alan hiç dönmez.

export const PHONE_SHARE_CONSENT_VERSION = "v3-2026-10";
export const DAILY_SHARE_LIMIT = 5;
export const MAX_USERS_PER_PHONE = 3;

export type PhoneShareView = {
  /** Kendi paylaşımım varsa maskeli gösterim ("0 5•• ••• •• 12"). */
  mine: string | null;
  /** Karşı taraf paylaştı mı (numara değil, yalnız bilgi). */
  counterpartShared: boolean;
  /** Yalnızca iki taraf da paylaştıysa ve görüşme aktifse çözülmüş numara. */
  counterpartPhone: string | null;
};

export async function pairBlocked(a: number, b: number): Promise<boolean> {
  const hit = await prisma.blockedUser.findFirst({
    where: { OR: [{ blockerId: a, blockedId: b }, { blockerId: b, blockedId: a }] },
    select: { id: true },
  });
  return hit != null;
}

/** `active`: çağıranın hesapladığı "görüşme açık + ilan aktif + bayrak açık + blok yok" sonucu. */
export async function getPhoneShareView(threadId: number, userId: number, active: boolean): Promise<PhoneShareView> {
  const rows = await prisma.threadPhoneShare.findMany({
    where: { threadId },
    select: { userId: true, phoneEnc: true, phoneLast2: true },
  });
  const mine = rows.find((r) => r.userId === userId) ?? null;
  const theirs = rows.find((r) => r.userId !== userId) ?? null;

  let counterpartPhone: string | null = null;
  if (active && mine && theirs) {
    try {
      counterpartPhone = displayPhone(decryptPhone(theirs.phoneEnc, `${threadId}:${theirs.userId}`));
    } catch (e) {
      console.error("[phone-share] çözme hatası", threadId, e instanceof Error ? e.message : "");
    }
  }
  return {
    mine: mine ? maskedPhone(mine.phoneLast2) : null,
    counterpartShared: theirs != null,
    counterpartPhone,
  };
}

/** Her paylaş/geri çek AYRI satır; numara loga YAZILMAZ, hash'li IP/UA (KVKK). */
export async function recordPhoneShareConsent(userId: number, threadId: number, isGranted: boolean, req: Request): Promise<void> {
  const { ipHash, userAgentHash } = hashRequestContext(req);
  await prisma.consentLog.create({
    data: {
      userId,
      consentType: "TRADE_PHONE_SHARE",
      isGranted,
      consentVersion: PHONE_SHARE_CONSENT_VERSION,
      context: `thread:${threadId}`,
      ipAddress: ipHash,
      userAgent: userAgentHash,
    },
  });
}
