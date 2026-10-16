import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

/** Katalog dışı yönetici eylemleri (denetim kaydı /admin/katalog/denetim sayfasında, katalog işlemleriyle birlikte görünür). */
export type AdminEylemi =
  | "USER_BAN" | "USER_UNBAN" | "USER_BAN_FROM_REPORT"
  | "DELETION_APPROVE" | "DELETION_REJECT"
  | "EXPERT_PROFILE_CREATE" | "EXPERT_PROFILE_DECISION" | "EXPERT_PROFILE_OVERRIDE"
  | "SUGGESTION_APPROVE" | "SUGGESTION_REJECT"
  | "PRODUCT_IMAGE_CHANGE" | "PRODUCT_ATTRIBUTES_CHANGE" | "PHOTO_BLUR" | "REPORT_ACTION";

export const ADMIN_EYLEM_ETIKETI: Record<AdminEylemi, string> = {
  USER_BAN: "Kullanıcı banlandı", USER_UNBAN: "Kullanıcı banı kaldırıldı", USER_BAN_FROM_REPORT: "Kullanıcı rapor üzerinden banlandı",
  DELETION_APPROVE: "Hesap silme talebi onaylandı", DELETION_REJECT: "Hesap silme talebi reddedildi",
  EXPERT_PROFILE_CREATE: "Usta profili oluşturuldu", EXPERT_PROFILE_DECISION: "Usta başvurusu karara bağlandı",
  EXPERT_PROFILE_OVERRIDE: "Usta profili durumu elle değiştirildi",
  SUGGESTION_APPROVE: "Araç önerisi onaylandı", SUGGESTION_REJECT: "Araç önerisi reddedildi",
  PRODUCT_IMAGE_CHANGE: "Araç görseli değiştirildi", PRODUCT_ATTRIBUTES_CHANGE: "Araç özellikleri değiştirildi",
  PHOTO_BLUR: "Fotoğraf bulanıklaştırıldı", REPORT_ACTION: "Rapor işlendi",
};

const json = (v: unknown) => (v === undefined || v === null ? undefined : (JSON.parse(JSON.stringify(v)) as Prisma.InputJsonValue));

/**
 * Yönetici eylemini denetim kaydına yazar. İşlem ZATEN tamamlandıktan sonra çağrılır ve en iyi çaba (best-effort) ilkesiyle
 * çalışır: kayıt yazılamazsa asıl işlem bozulmaz ama hata günlüğe düşer. Kişisel veri (e-posta vb.) meta'ya konmaz; yalnız id.
 */
export async function adminEylemiKaydet(g: {
  adminId: number;
  action: AdminEylemi;
  entityType: "USER" | "DELETION_REQUEST" | "EXPERT_PROFILE" | "SUGGESTION" | "PRODUCT" | "PHOTO" | "REPORT";
  entityId?: number | null;
  entityLabel?: string | null;
  meta?: unknown;
}): Promise<void> {
  try {
    const admin = await prisma.user.findUnique({ where: { id: g.adminId }, select: { displayName: true, email: true } });
    await prisma.catalogAuditLog.create({
      data: {
        adminId: g.adminId,
        adminLabel: (admin?.displayName || admin?.email || `#${g.adminId}`).slice(0, 160),
        action: g.action,
        entityType: g.entityType,
        entityId: g.entityId ?? null,
        entityLabel: g.entityLabel?.slice(0, 240) ?? null,
        meta: json(g.meta),
      },
    });
  } catch (e) {
    console.error("[adminEylemiKaydet]", g.action, e);
  }
}
