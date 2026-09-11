// ─────────────────────────────────────────────
// USTA GÖRÜŞLERI — İtiraz akışı sabitleri + otomatik kesinleşme.
//
// ⚠️ BİLİNÇLİ SADELEŞTİRME: "14 gün içinde incelenmezse otomatik kesinleşir"
// kuralı AYRI BİR CRON GEREKTİRMEZ — bu proje zaten çok sayıda cron/migration
// biriktirdi, düşük hacimde (şu an 0 usta) yeni bir zamanlanmış iş eklemek
// yerine LAZY kontrol tercih edildi: admin itiraz kuyruğu sayfası ve ustanın
// kendi itiraz durumunu gördüğü her sayfa `finalizeExpiredAppeals()` çağırır.
// Bu, süresi geçmiş bir itirazın "duvar saati" 14. günde değil, birinin bu
// sayfaları bir sonraki ziyaretinde kesinleşeceği anlamına gelir — düşük
// trafikte kabul edilebilir bir gecikme, tam cron isteniyorsa eklenir.
// ─────────────────────────────────────────────

import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notification";

export const APPEAL_WINDOW_DAYS = 30;
export const MAX_APPEALS_PER_WINDOW = 2;
export const APPEAL_REVIEW_DUE_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

export async function canFileNewAppeal(profileId: number): Promise<boolean> {
  const windowStart = new Date(Date.now() - APPEAL_WINDOW_DAYS * DAY_MS);
  const count = await prisma.expertAppeal.count({
    where: { profileId, createdAt: { gte: windowStart } },
  });
  return count < MAX_APPEALS_PER_WINDOW;
}

// Süresi geçmiş PENDING itirazları AUTO_FINALIZED yapar (orijinal karar
// kesinleşir — not reddi kalır, görünürlük kararı kalır). Fire-and-forget
// güvenlidir, admin sayfası ve usta durumu sayfaları render öncesi çağırır.
export async function finalizeExpiredAppeals(): Promise<number> {
  const expired = await prisma.expertAppeal.findMany({
    where: { status: "PENDING", reviewDueAt: { lt: new Date() } },
    select: { id: true, profile: { select: { userId: true } } },
  });
  if (expired.length === 0) return 0;

  await prisma.expertAppeal.updateMany({
    where: { id: { in: expired.map((a) => a.id) } },
    data: { status: "AUTO_FINALIZED", decidedAt: new Date() },
  });

  await Promise.all(
    expired.map((a) =>
      createNotification({
        userId: a.profile.userId,
        type: "EXPERT_APPEAL_DECIDED",
        message: "İtirazınız incelenme süresi içinde değerlendirilemediği için orijinal karar kesinleşti.",
        link: "/usta-gorusu/notlarim",
      }).catch(() => {})
    )
  );

  return expired.length;
}
