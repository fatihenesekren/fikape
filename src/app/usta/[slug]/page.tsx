import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { EXPERT_BADGE } from "@/lib/expertNote";
import { stripModelGenRange } from "@/lib/modelDisplay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.expertProfile.findUnique({
    where: { slug },
    select: { headline: true, status: true, cvNoindex: true },
  });
  if (!profile || profile.status !== "ACTIVE") return {};
  return {
    title: `${profile.headline ?? "Usta"} — Doğrulanmış Usta | fikape`,
    description: `${profile.headline ?? "Usta"} — fikape'de doğrulanmış usta profili ve teknik katkıları.`,
    robots: profile.cvNoindex ? { index: false } : undefined,
  };
}

// Usta profil sayfası — İletişim bölümü (b) rızası + en az bir alan girilmişse
// (contactVisible) gösterilir; site-içi mesajlaşma altyapısı henüz yok (bkz.
// memory — takas mesajlaşmasına benzer ayrı bir sistem, Aşama 6'da bilinçli
// olarak ertelendi). Görünürlük şimdilik yalnız status=ACTIVE'e bağlı —
// barem/visibilityState (Aşama 7) devreye girince PAUSED/PROBATION için
// 200+noindex davranışı buraya eklenecek.
export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const profile = await prisma.expertProfile.findUnique({
    where: { slug },
    select: {
      headline: true, bio: true, expertiseTags: true, city: true, district: true,
      status: true, createdAt: true, contactVisible: true, contactPhone: true, contactAddress: true,
      user: { select: { displayName: true } },
    },
  });
  if (!profile || profile.status !== "ACTIVE") notFound();

  const notes = await prisma.expertNote.findMany({
    where: { profile: { slug }, status: "PUBLISHED", removedAt: null },
    select: {
      id: true, title: true, publishedAt: true, createdAt: true,
      model: {
        select: {
          name: true,
          brand: { select: { name: true } },
          products: {
            where: { isActive: true },
            orderBy: { weeklyViewCount: "desc" },
            take: 1,
            select: { slug: true },
          },
        },
      },
    },
    orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="space-y-3 mb-8">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ color: EXPERT_BADGE.color, background: EXPERT_BADGE.bg }}
          title={EXPERT_BADGE.tooltip}
        >
          {EXPERT_BADGE.icon} {EXPERT_BADGE.label}
        </span>
        <h1 className="text-2xl font-black text-gray-900">{profile.headline}</h1>
        <p className="text-sm text-gray-400">
          {profile.user.displayName}
          {profile.city && ` · ${profile.city}`}
        </p>
      </div>

      {profile.expertiseTags.length > 0 && (
        <div className="mb-6">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Uzmanlık Alanları</p>
          <div className="flex flex-wrap gap-1.5">
            {profile.expertiseTags.map((t) => (
              <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{t}</span>
            ))}
          </div>
        </div>
      )}

      {profile.bio && (
        <div className="mb-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Hakkında</p>
          <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {profile.contactVisible && (profile.contactPhone || profile.contactAddress) && (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
          {profile.contactPhone && <p className="text-sm text-gray-800">📞 {profile.contactPhone}</p>}
          {profile.contactAddress && <p className="text-sm text-gray-800">📍 {profile.contactAddress}</p>}
          <p className="text-[11px] text-gray-400 pt-1 leading-relaxed">
            Bu bilgi ustanın kendi beyanıdır. fikape, kurduğunuz iş ilişkisinin tarafı değildir;
            işçilik veya onarım kalitesini garanti etmez.
          </p>
        </div>
      )}

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Katkıları {notes.length > 0 && `(${notes.length})`}
        </p>
        {notes.length === 0 ? (
          <p className="text-sm text-gray-400">Henüz yayınlanmış usta notu yok.</p>
        ) : (
          <div className="space-y-2">
            {notes.map((n) => {
              const productSlug = n.model.products[0]?.slug;
              const modelName = `${n.model.brand.name} ${stripModelGenRange(n.model.name)}`;
              return productSlug ? (
                <Link
                  key={n.id}
                  href={`/araclar/${productSlug}?sekme=usta-gorusleri`}
                  className="block bg-white border border-gray-100 rounded-xl p-3.5 hover:border-gray-300 transition-colors"
                >
                  <p className="text-xs text-gray-400">{modelName}</p>
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                </Link>
              ) : (
                <div key={n.id} className="bg-white border border-gray-100 rounded-xl p-3.5">
                  <p className="text-xs text-gray-400">{modelName}</p>
                  <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
