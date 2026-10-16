import { prisma } from "@/lib/prisma";
import type { ConsentType } from "@/generated/prisma/client";
import { hashRequestContext } from "@/lib/security";

// Usta iletişim/bölgesel rızaları için sürüm — gerçek hukuki metin (bkz.
// docs/usta-gorusleri-hukuki-metinler.md, avukat onayı bekliyor) yürürlüğe
// girince bu sürüm artırılmalı, eski rızalar yeniden istenmeli.
export const EXPERT_CONSENT_VERSION = "v1-taslak";

// Bir kullanıcının bir rıza türü için EN SON verdiği kararı döner (kayıt
// yoksa null — hiç sorulmamış demektir). ConsentLog append-only: her karar
// (ver/geri çek) ayrı satır, en güncel olan geçerli durumdur.
export async function getLatestConsent(userId: number, consentType: ConsentType): Promise<boolean | null> {
  const last = await prisma.consentLog.findFirst({
    where: { userId, consentType },
    orderBy: { createdAt: "desc" },
    select: { isGranted: true },
  });
  return last?.isGranted ?? null;
}

export async function recordConsent(params: {
  userId: number;
  consentType: ConsentType;
  isGranted: boolean;
  req?: Request;
}): Promise<void> {
  // KVKK: ham IP/User-Agent saklanmaz (diğer rıza/değerlendirme kayıtlarıyla aynı HMAC özeti); IP için platform başlığı önceliği
  // (x-vercel-forwarded-for) getClientIp içinde — istemci X-Forwarded-For ile sahteleyemez.
  const ctx = params.req ? hashRequestContext(params.req) : null;
  const ipAddress = ctx?.ipHash ?? null;
  const userAgent = ctx?.userAgentHash ?? null;
  await prisma.consentLog.create({
    data: {
      userId: params.userId,
      consentType: params.consentType,
      isGranted: params.isGranted,
      consentVersion: EXPERT_CONSENT_VERSION,
      ipAddress,
      userAgent,
    },
  });
}
