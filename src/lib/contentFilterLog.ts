import { prisma } from "@/lib/prisma";
import type { FilterRule } from "@/lib/reviewValidation";

// İçerik filtresi bir gönderimi engellediğinde bırakılan hafif iz. Ham metin
// TUTULMAZ — sadece kim, nerede, hangi kural. Amaç: tekrar eden ihlalciyi
// (IBAN/telefon/e-posta paylaşmayı deneyip duran, ihlali iki mesaja bölen
// kullanıcı) admin panelinde görünür kılmak. Yanıtı asla bloklamaz / hata
// fırlatmaz (fire-and-forget).
export type ContentFilterSurface =
  | "REVIEW"
  | "QNA"
  | "TRADE_MESSAGE"
  | "TRADE_THREAD"
  | "TRADE_LISTING"
  | "TRADE_RATING"
  | "VEHICLE_SUGGEST";

export function logContentFilterHit(params: {
  userId: number;
  surface: ContentFilterSurface;
  rule: FilterRule | undefined;
  threadId?: number | null;
}): void {
  // Uzunluk/format hatalarında rule boş gelir — onları izlemiyoruz.
  if (!params.rule) return;
  if (!Number.isFinite(params.userId)) return;

  void prisma.contentFilterHit
    .create({
      data: {
        userId: params.userId,
        surface: params.surface,
        rule: params.rule,
        threadId: params.threadId ?? null,
      },
    })
    .catch(() => {});
}
