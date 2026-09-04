import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";
import { sendAdminAlertEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";

// E-posta bildirim tercihinden bağımsız — kullanıcı e-postaları kapatmış
// olsa bile site içi kayıt her zaman oluşturulur (bkz. NotificationBell,
// profil sayfası "Bildirimler" bölümü).
export function createNotification(params: {
  userId: number;
  type: NotificationType;
  message: string;
  link: string;
}) {
  return prisma.notification.create({ data: params }).catch((e) => console.error("[notification]", e));
}

// Admin'e özel bildirim — "bekleyen onay" kuyruklarından birine yeni bir öğe
// düştüğünde çağrılır (bkz. schema.prisma ADMIN_* enum notu). İki kanal:
// 1) Site içi bildirim (bell) — HER zaman, admin trustLevel>=5 her kullanıcıya
//    (pratikte tek kişi, ama çoklu admin ileride sorunsuz çalışır).
// 2) E-posta — kategori başına 10 dakikada 1'e sınırlı (checkRateLimit ile,
//    limit=1) — art arda gelen olaylar (ör. spam saldırısı, toplu yorum) tek
//    e-postaya sıkışır, gelen kutusu şişmez. Bell'deki kayıt bundan etkilenmez,
//    her olay için ayrı ayrı oluşur — admin panelde hiçbir öğe "kayıp" olmaz.
export async function notifyAdmins(params: {
  type: NotificationType;
  message: string;
  link: string;
  emailSubject: string;
  emailTitle: string;
  emailMessage: string;
  rateLimitKey: string;
}) {
  const admins = await prisma.user.findMany({
    where: { trustLevel: { gte: 5 } },
    select: { id: true, email: true },
  }).catch(() => []);
  if (admins.length === 0) return;

  await Promise.all(
    admins.map((a) =>
      createNotification({ userId: a.id, type: params.type, message: params.message, link: params.link })
    )
  );

  const canEmail = await checkRateLimit(`admin-alert:${params.rateLimitKey}`, 1, 10 * 60 * 1000);
  if (!canEmail) return;

  await Promise.all(
    admins.map((a) =>
      sendAdminAlertEmail({
        to: a.email,
        subject: params.emailSubject,
        title: params.emailTitle,
        message: params.emailMessage,
        link: params.link,
      }).catch((e) => console.error("[admin-alert-email]", e))
    )
  );
}
