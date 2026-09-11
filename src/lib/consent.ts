import { prisma } from "@/lib/prisma";
import type { ConsentType } from "@/generated/prisma/client";

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
  const ipAddress = params.req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  const userAgent = params.req?.headers.get("user-agent") ?? null;
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
