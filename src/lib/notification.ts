import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";

// E-posta bildirim tercihinden bağımsız — kullanıcı e-postaları kapatmış
// olsa bile site içi kayıt her zaman oluşturulur (bkz. NotificationBell,
// profil sayfası "Bildirimler" bölümü).
export function createNotification(params: {
  userId: number;
  type: NotificationType;
  message: string;
  link: string;
}) {
  return prisma.notification.create({ data: params }).catch(() => {});
}
