import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { OnerilerClient } from "./OnerilerClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Araç Önerileri",
  robots: { index: false },
};

export default async function AdminOnerilerPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const adminUser = await prisma.user.findUnique({
    where: { id: Number(session.user.id) },
    select: { trustLevel: true },
  });
  if (!adminUser || adminUser.trustLevel < 5) redirect("/");

  const suggestions = await prisma.vehicleSuggestion.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { displayName: true, email: true } },
    },
  });

  const serialized = suggestions.map((s) => ({
    id: s.id,
    brandName: s.brandName,
    modelName: s.modelName,
    year: s.year,
    categorySlug: s.categorySlug,
    fuelType: s.fuelType,
    trimName: s.trimName,
    notes: s.notes,
    status: s.status,
    adminNote: s.adminNote,
    createdAt: s.createdAt.toISOString(),
    user: s.user ? { displayName: s.user.displayName, email: s.user.email } : null,
    hasReview: !!s.reviewData,
    photoCount: Array.isArray(s.photoUrls) ? s.photoUrls.length : 0,
  }));

  const pendingCount = serialized.filter((s) => s.status === "PENDING").length;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Link href="/admin/yorumlar" className="text-xs text-gray-400 hover:text-gray-700 transition-colors">
              ← Admin
            </Link>
          </div>
          <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
            Araç Önerileri
            {pendingCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
                {pendingCount} bekliyor
              </span>
            )}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            Kullanıcıların önerdiği araçları incele ve kataloğa ekle.
          </p>
        </div>
      </div>

      <OnerilerClient initialSuggestions={serialized} />
    </div>
  );
}
