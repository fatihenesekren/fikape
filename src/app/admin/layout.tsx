import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
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

  const [pendingReviews, pendingSuggestions, newInsuranceLeads, newSaleLeads, pendingMessageReports, pendingContentReports] = await Promise.all([
    prisma.review.count({
      where: { OR: [{ status: "PENDING" }, { status: "PUBLISHED", photos: { some: { status: "PENDING" } } }] },
    }).catch(() => 0),
    prisma.vehicleSuggestion.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.insuranceLead.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.saleLead.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.messageReport.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.contentReport.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  const navItems = [
    { href: "/admin/yorumlar",  label: "Yorumlar",       shortLabel: "Yorumlar",  icon: "💬", badge: pendingReviews },
    { href: "/admin/oneriler",  label: "Araç Önerileri", shortLabel: "Öneriler",  icon: "🚗", badge: pendingSuggestions },
    { href: "/admin/araclar",   label: "Görseller",      shortLabel: "Görseller", icon: "🖼️", badge: 0 },
    { href: "/admin/leads",     label: "Gelir Talepleri", shortLabel: "Talepler", icon: "🛡️", badge: newInsuranceLeads + newSaleLeads },
    { href: "/admin/mesaj-raporlari", label: "Mesaj Raporları", shortLabel: "Raporlar", icon: "🚩", badge: pendingMessageReports },
    { href: "/admin/icerik-bildirimleri", label: "İçerik Bildirimleri", shortLabel: "Bildirimler", icon: "⚠️", badge: pendingContentReports },
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
