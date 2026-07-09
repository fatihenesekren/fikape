import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — fikape", robots: { index: false } };

export default async function AdminPage() {
  const [pendingReviews, pendingSuggestions, totalProducts, totalReviews] = await Promise.all([
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.vehicleSuggestion.count({ where: { status: "PENDING" } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.review.count({ where: { status: "PUBLISHED" } }),
  ]);

  const cards = [
    {
      href: "/admin/yorumlar",
      icon: "💬",
      label: "Yorumlar",
      desc: "Bekleyen yorumları onayla veya reddet",
      badge: pendingReviews,
      badgeLabel: "bekliyor",
      color: "blue",
    },
    {
      href: "/admin/oneriler",
      icon: "🚗",
      label: "Araç Önerileri",
      desc: "Kullanıcı önerilerini incele, teknik özelliklerini ekle",
      badge: pendingSuggestions,
      badgeLabel: "bekliyor",
      color: "orange",
    },
    {
      href: "/admin/araclar",
      icon: "🖼️",
      label: "Araç Görselleri",
      desc: "Katalog araçlarının görsellerini yönet",
      badge: 0,
      badgeLabel: "",
      color: "gray",
    },
    {
      href: "/admin/urunler",
      icon: "🔧",
      label: "Teknik Özellikler",
      desc: "Katalog araçlarının motor, kasa, güç gibi özelliklerini gir",
      badge: 0,
      badgeLabel: "",
      color: "gray",
    },
  ];

  return (
    <div className="px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Admin Paneli</h1>
        <div className="flex gap-6 mt-3 text-sm text-gray-500">
          <span><strong className="text-gray-900">{totalProducts}</strong> aktif araç</span>
          <span><strong className="text-gray-900">{totalReviews}</strong> yayınlanan yorum</span>
        </div>
      </div>

      <div className="space-y-3">
        {cards.map((c) => (
          <Link
            key={c.href}
            href={c.href}
            className="flex items-center justify-between gap-4 bg-white border border-gray-100 rounded-2xl px-6 py-5 hover:border-gray-300 hover:shadow-sm transition-all group"
          >
            <div className="flex items-center gap-4">
              <span className="text-2xl">{c.icon}</span>
              <div>
                <p className="font-bold text-gray-900 group-hover:text-gray-700">{c.label}</p>
                <p className="text-sm text-gray-400 mt-0.5">{c.desc}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              {c.badge > 0 && (
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                  c.color === "orange" ? "bg-orange-100 text-orange-700" : "bg-blue-100 text-blue-700"
                }`}>
                  {c.badge} {c.badgeLabel}
                </span>
              )}
              <span className="text-gray-300 group-hover:text-gray-500 transition-colors">→</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
