import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UstaShareCard } from "./UstaShareCard";
import { BackLink } from "@/components/BackLink";

export const metadata = { title: "Usta Profilini Paylaş — fikape" };

// Yorumun aksine (sadece sahibi kendi yorumunu paylaşır) bu sayfa herkese
// açık — amaç bir ziyaretçinin beğendiği bir ustayı arkadaşına önerebilmesi
// (bkz. kullanıcı isteği), giriş veya sahiplik gerekmez.
export default async function ShareExpertPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.expertProfile.findUnique({
    where: { slug },
    select: { headline: true, status: true },
  });

  if (!profile || profile.status !== "ACTIVE") notFound();

  const headline = profile.headline ?? "Usta";

  return (
    <div className="max-w-md mx-auto px-4 py-10 space-y-6">
      <BackLink fallbackHref={`/usta/${slug}`} label="← Geri dön" className="text-sm text-gray-400 hover:text-gray-700 transition-colors" />

      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold mb-1">
          Usta Profili
        </p>
        <h1 className="text-2xl font-black text-gray-900">Kartını Paylaş</h1>
        <p className="text-sm text-gray-500 mt-1">
          {headline} bir story kartına dönüştü — arkadaşlarınla paylaş.
        </p>
      </div>

      <UstaShareCard slug={slug} headline={headline} />
    </div>
  );
}
