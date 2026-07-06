import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AdminNav } from "./AdminNav";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) redirect("/");

  const [pendingReviews, pendingSuggestions, newInsuranceLeads, newSaleLeads] = await Promise.all([
    prisma.review.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.vehicleSuggestion.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.insuranceLead.count({ where: { status: "NEW" } }).catch(() => 0),
    prisma.saleLead.count({ where: { status: "NEW" } }).catch(() => 0),
  ]);

  const navItems = [
    { href: "/admin/yorumlar",  label: "Yorumlar",       icon: "💬", badge: pendingReviews },
    { href: "/admin/oneriler",  label: "Araç Önerileri", icon: "🚗", badge: pendingSuggestions },
    { href: "/admin/araclar",   label: "Görseller",      icon: "🖼️", badge: 0 },
    { href: "/admin/leads",     label: "Gelir Talepleri", icon: "🛡️", badge: newInsuranceLeads + newSaleLeads },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminNav items={navItems} />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  );
}
