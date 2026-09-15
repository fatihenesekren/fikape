import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@/generated/prisma/client";
import { sendAdminAlertEmail } from "@/lib/email";
import { checkRateLimit } from "@/lib/rateLimit";
import { stripGenRangeAnywhere } from "@/lib/modelDisplay";

// E-posta bildirim tercihinden bağımsız — kullanıcı e-postaları kapatmış
// olsa bile site içi kayıt her zaman oluşturulur (bkz. NotificationBell,
// profil sayfası "Bildirimler" bölümü).
export function createNotification(params: {
  userId: number;
  type: NotificationType;
  message: string;
  link: string;
  // Usta notu başlığı içeren bildirimler için (NEW_QUESTION/QUESTION_ANSWERED/
  // EXPERT_NOTE_PUBLISHED) — kullanıcı notun başlığını sonradan düzeltirse
  // eski bildirim metni de güncel kalsın diye (bkz. resolveLiveNotificationMessages).
  expertNoteId?: number;
}) {
  return prisma.notification.create({ data: params }).catch((e) => console.error("[notification]", e));
}

// "X başlıklı usta notu..." biçimindeki bildirim metinlerini, notun GÜNCEL
// başlığıyla yeniden kurar — kullanıcı fark etti: notun başlığını düzeltince
// eski bildirimler eski (hatalı) başlığı göstermeye devam ediyordu, çünkü
// mesaj oluşturma anında düz metin olarak donduruluyordu. Tek toplu sorgu
// (N+1 değil) — sayfadaki bildirimlerin işaret ettiği notlar bir kerede
// çekilip bellekte eşleştiriliyor, sayfa performansına ölçülebilir bir
// maliyeti yok. expertNoteId yoksa (eski kayıt, geriye dönük doldurulamayan
// tür) veya not silinmişse mesaj olduğu gibi (donmuş haliyle) kalır.
export async function resolveLiveNotificationMessages<
  T extends { type: string; message: string; expertNoteId?: number | null }
>(notifications: T[]): Promise<T[]> {
  const noteIds = [...new Set(notifications.map((n) => n.expertNoteId).filter((id): id is number => id != null))];
  if (noteIds.length === 0) return notifications;

  const notes = await prisma.expertNote.findMany({
    where: { id: { in: noteIds } },
    select: { id: true, title: true },
  });
  const titleById = new Map(notes.map((n) => [n.id, stripGenRangeAnywhere(n.title)]));

  return notifications.map((n) => {
    const liveTitle = n.expertNoteId != null ? titleById.get(n.expertNoteId) : undefined;
    if (!liveTitle) return n;
    if (n.type === "NEW_QUESTION") return { ...n, message: `"${liveTitle}" başlıklı usta notunuza yeni bir soru soruldu` };
    if (n.type === "QUESTION_ANSWERED") return { ...n, message: `"${liveTitle}" başlıklı usta notuna sorduğun soru cevaplandı` };
    if (n.type === "EXPERT_NOTE_PUBLISHED") return { ...n, message: `"${liveTitle}" başlıklı usta notunuz yayınlandı` };
    return n;
  });
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
