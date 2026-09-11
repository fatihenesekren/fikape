import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/timeAgo";
import { AdminNav } from "./AdminNav";
import { AdminBottomNav } from "./AdminBottomNav";
import { AdminMobileHeader } from "./AdminMobileHeader";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) redirect("/");

  const filterWindowStart = daysAgo(30);

  const [pendingReviews, pendingSuggestions, newInsuranceLeads, newSaleLeads, pendingMessageReports, pendingContentReports, pendingDeletionRequests, repeatFilterOffenders, pendingTradePhotos, pendingExpertNotes, pendingExpertApplications, pendingExpertAnswers] = await Promise.all([
    prisma.review.count({
      where: { OR: [{ status: "PENDING" }, { status: "PUBLISHED", photos: { some: { status: "PENDING" } } }] },
    }).catch(() => 0),
    prisma.vehicleSuggestion.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.insuranceLead.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.saleLead.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.messageReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.contentReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.dataDeletionRequest.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.contentFilterHit.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: filterWindowStart }, user: { isBanned: false } },
      _count: { id: true },
      having: { id: { _count: { gte: 3 } } },
    }).then((g) => g.length).catch(() => 0),
    prisma.tradeListingPhoto.count({ where: { status: "PENDING", tradeListing: { isActive: true } } }).catch(() => 0),
    prisma.expertNote.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.expertProfile.count({ where: { status: "PENDING_VERIFICATION" } }).catch(() => 0),
    prisma.answer.count({ where: { status: "PENDING", answeredByExpertProfileId: { not: null } } }).catch(() => 0),
  ]);

  const navItems = [
    { href: "/admin/yorumlar",  label: "Yorumlar",       shortLabel: "Yorumlar",  icon: "💬", badge: pendingReviews },
    { href: "/admin/usta-basvurulari", label: "Usta Başvuruları", shortLabel: "Usta Başv.", icon: "🧑‍🔧", badge: pendingExpertApplications },
    { href: "/admin/usta-notlari", label: "Usta Notları", shortLabel: "Usta Notları", icon: "🔧", badge: pendingExpertNotes + pendingExpertAnswers },
    { href: "/admin/oneriler",  label: "Araç Önerileri", shortLabel: "Öneriler",  icon: "🚗", badge: pendingSuggestions },
    { href: "/admin/araclar",   label: "Görseller",      shortLabel: "Görseller", icon: "🖼️", badge: 0 },
    { href: "/admin/urunler",   label: "Teknik Özellikler", shortLabel: "Özellikler", icon: "🔧", badge: 0 },
    { href: "/admin/leads",     label: "Gelir Talepleri", shortLabel: "Talepler", icon: "🛡️", badge: newInsuranceLeads + newSaleLeads },
    { href: "/admin/mesaj-raporlari", label: "Mesaj Raporları", shortLabel: "Raporlar", icon: "🚩", badge: pendingMessageReports },
    { href: "/admin/takas-fotograflari", label: "Takas Fotoğrafları", shortLabel: "Takas Foto", icon: "📷", badge: pendingTradePhotos },
    { href: "/admin/takas-talep-raporu", label: "Takas Talep Raporu", shortLabel: "Talep", icon: "📊", badge: 0 },
    { href: "/admin/hesap-silme-talepleri", label: "Hesap Silme Talepleri", shortLabel: "Silme", icon: "🗑️", badge: pendingDeletionRequests },
    { href: "/admin/icerik-bildirimleri", label: "İçerik Bildirimleri", shortLabel: "Bildirimler", icon: "⚠️", badge: pendingContentReports },
    { href: "/admin/icerik-filtresi", label: "İçerik Filtresi", shortLabel: "Filtre", icon: "🛑", badge: repeatFilterOffenders },
  ];

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-gray-50">
      <AdminNav items={navItems} />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminMobileHeader />
        <main className="flex-1 overflow-auto pb-16 md:pb-0">
          {children}
        </main>
      </div>
      <AdminBottomNav items={navItems} />
    </div>
  );
}
