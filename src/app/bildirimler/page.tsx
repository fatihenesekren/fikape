import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { BildirimlerClient } from "./BildirimlerClient";

export const metadata: Metadata = { title: "Bildirimler" };

const PAGE_SIZE = 20;

export default async function BildirimlerPage({
  searchParams,
}: {
  searchParams: Promise<{ sayfa?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);
  const { sayfa } = await searchParams;
  const page = Math.max(1, parseInt(sayfa ?? "1", 10) || 1);

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: { id: true, type: true, message: true, link: true, isRead: true, createdAt: true },
    }),
    prisma.notification.count({ where: { userId } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">Bildirimler</h1>
        <Link href="/profil" className="text-xs font-semibold text-gray-500 hover:text-gray-800">
          ← Profile dön
        </Link>
      </div>

      <BildirimlerClient
        notifications={notifications.map((n) => ({ ...n, createdAt: n.createdAt.toISOString() }))}
      />

      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          {page > 1 ? (
            <Link href={`/bildirimler?sayfa=${page - 1}`} className="text-sm font-semibold text-gray-700 hover:underline">
              ← Önceki
            </Link>
          ) : <span />}
          <span className="text-xs text-gray-400">Sayfa {page} / {totalPages}</span>
          {page < totalPages ? (
            <Link href={`/bildirimler?sayfa=${page + 1}`} className="text-sm font-semibold text-gray-700 hover:underline">
              Sonraki →
            </Link>
          ) : <span />}
        </div>
      )}
    </div>
  );
}
