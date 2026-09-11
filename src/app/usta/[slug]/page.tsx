import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { EXPERT_BADGE } from "@/lib/expertNote";
import { contactFeedbackLabel } from "@/lib/expertContactFeedback";
import { stripModelGenRange } from "@/lib/modelDisplay";
import { ExpertMessageComposer } from "./ExpertMessageComposer";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const profile = await prisma.expertProfile.findUnique({
    where: { slug },
    select: { headline: true, status: true, cvNoindex: true, visibilityState: true },
  });
  if (!profile || profile.status !== "ACTIVE") return {};
  const forceNoindex = profile.visibilityState === "PAUSED" || profile.visibilityState === "PROBATION";
  return {
    title: `${profile.headline ?? "Usta"} — Usta Profili | fikape`,
    description: `${profile.headline ?? "Usta"} — fikape'de usta profili ve teknik katkıları.`,
    robots: profile.cvNoindex || forceNoindex ? { index: false } : undefined,
  };
}

// Usta profil sayfası — İletişim bölümü (b) rızası + en az bir alan girilmişse
// (contactVisible) gösterilir; site-içi maskeli mesajlaşma (Aşama 6b) ayrıca
// ve HER ZAMAN mevcuttur (rızadan bağımsız — §7.2). Sayfa varlığı yalnız
// status=ACTIVE'e bağlı. Barem
// (Aşama 7) PAUSED/PROBATION üretirse: sayfa 200 kalır ama noindex olur ve
// iletişim bölümü gizlenir — notlar ve rozet her zaman görünür kalır (§14.13).
export default async function ExpertProfilePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const [profile, session] = await Promise.all([
    prisma.expertProfile.findUnique({
      where: { slug },
      select: {
        id: true, headline: true, bio: true, expertiseTags: true, city: true, district: true,
        status: true, createdAt: true, contactVisible: true, contactPhone: true, contactAddress: true,
        visibilityState: true, userId: true,
        user: { select: { displayName: true } },
      },
    }),
    auth(),
  ]);
  if (!profile || profile.status !== "ACTIVE") notFound();
  const promotionPaused = profile.visibilityState === "PAUSED" || profile.visibilityState === "PROBATION";

  // Site-içi maskeli mesajlaşma — telefon/e-posta paylaşmadan iletişim
  // alternatifi (§7.2: (b) rızası olmasa da her zaman mevcut). Kendi
  // profiline veya bloklu kullanıcıya gösterilmez.
  const viewerId = session?.user?.id ? Number(session.user.id) : null;
  const isOwnProfile = viewerId === profile.userId;
  const isBlocked = viewerId && !isOwnProfile
    ? !!(await prisma.blockedUser.findFirst({
        where: {
          OR: [
            { blockerId: viewerId, blockedId: profile.userId },
            { blockerId: profile.userId, blockedId: viewerId },
          ],
        },
        select: { id: true },
      }))
    : false;
  const canMessage = !!viewerId && !isOwnProfile && !isBlocked;

  const confirmedContactCount = profile.contactVisible
    ? await prisma.expertContactFeedback.count({ where: { profileId: profile.id, isAccurate: true } })
    : 0;
  const contactFeedbackText = contactFeedbackLabel(confirmedContactCount);

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

      {!promotionPaused && profile.contactVisible && (profile.contactPhone || profile.contactAddress) && (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
          {profile.contactPhone && <p className="text-sm text-gray-800">📞 {profile.contactPhone}</p>}
          {profile.contactAddress && <p className="text-sm text-gray-800">📍 {profile.contactAddress}</p>}
          {contactFeedbackText && (
            <p className="text-[11px] font-semibold text-green-700">✓ {contactFeedbackText}</p>
          )}
          <p className="text-[11px] text-gray-400 pt-1 leading-relaxed">
            Bu bilgi ustanın kendi beyanıdır, fikape tarafından doğrulanmaz. fikape, kurduğunuz iş
            ilişkisinin tarafı değildir; işçilik veya onarım kalitesini garanti etmez.
          </p>
        </div>
      )}

      {canMessage && (
        <div className="mb-8">
          <ExpertMessageComposer expertProfileId={profile.id} />
        </div>
      )}
      {viewerId && !isOwnProfile && isBlocked && (
        <p className="mb-8 text-xs text-gray-400">Bu ustayla mesajlaşamazsınız.</p>
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
