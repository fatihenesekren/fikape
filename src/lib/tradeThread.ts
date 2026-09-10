// Takas görüşmesi durum kuralları — tek kaynak.

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "./prisma";

// "Görüşmeyi kapat" sonrası, KAPATAN kişiye karşı, karşı taraf bu kadar gün
// yeni bir görüşme başlatamaz (kullanıcı-çifti bazlı, ilandan bağımsız —
// çok-ilan üzerinden sık boğaz etmeyi otomatik friction'la keser). Kalıcı
// çözüm "Kişiyi engelle".
export const CLOSE_COOLDOWN_DAYS = 7;
export const CLOSE_COOLDOWN_MS = CLOSE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// Bir kişiyle bu kadar görüşme kapattıysan arayüz "Kişiyi engelle" önerisini
// öne çıkarır (eskalasyon uyarısı).
export const ESCALATION_CLOSE_COUNT = 2;

// Bir kullanıcı çifti (bakan kişi ↔ ilan sahibi) arasında "canlı" görüşme
// filtresi — YÖNDEN ve İLANDAN bağımsız. Aynı where hem ilan sayfasında
// (formu gizle, mevcut görüşmeye yönlendir) hem thread-create route'unda
// (409 + threadId) kullanılır; tek kaynak olması, iki tarafın birbirinden
// habersiz ayrı ilanlarda paralel görüşme açmasını engeller.
//
// Canlı = engellenmemiş
//         + çapa ilan hâlâ aktif (kapanmış/pasif ilandaki eski görüşmeye
//           yönlendirme yapılmaz — bkz. Option A "bilinen artık" notu)
//         + (hiç kapanmamış VEYA bakan kişinin kendi kapattığı — kendi
//           kapattığını "yeniden aç" ekranına yönlendiririz).
// `interestLostByUserId` bilinçli olarak DIŞARIDA bırakılmadı: "ilgilenmiyorum"
// görüşmeyi kapatmaz, yeniden bağlanma yolu budur.
export function livePairThreadWhere(
  meId: number,
  ownerId: number,
): Prisma.MessageThreadWhereInput {
  return {
    blockedByUserId: null,
    tradeListing: { isActive: true },
    AND: [
      {
        OR: [
          { initiatorId: meId, tradeListing: { userId: ownerId } },
          { initiatorId: ownerId, tradeListing: { userId: meId } },
        ],
      },
      { OR: [{ closedByUserId: null }, { closedByUserId: meId }] },
    ],
  };
}

// İlan sahibi bu kullanıcı çiftiyle bir görüşmeyi son CLOSE_COOLDOWN_MS içinde
// KAPATTIYSA (engel değil, soft "kapat"), karşı taraf yeni görüşme başlatamaz.
// Dönen değer: bekleme bitiş tarihi, cooldown yoksa null.
export async function ownerCloseCooldownUntil(
  meId: number,
  ownerId: number,
): Promise<Date | null> {
  const recent = await prisma.messageThread.findFirst({
    where: {
      closedByUserId: ownerId,
      closedAt: { gte: new Date(Date.now() - CLOSE_COOLDOWN_MS) },
      blockedByUserId: null,
      OR: [{ initiatorId: meId }, { tradeListing: { userId: meId } }],
    },
    orderBy: { closedAt: "desc" },
    select: { closedAt: true },
  });
  return recent?.closedAt
    ? new Date(recent.closedAt.getTime() + CLOSE_COOLDOWN_MS)
    : null;
}
