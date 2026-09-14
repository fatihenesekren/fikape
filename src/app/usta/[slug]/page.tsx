import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { EXPERT_BADGE, CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES } from "@/lib/expertNote";
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
    select: { id: true, headline: true, status: true, cvNoindex: true, visibilityState: true },
  });
  if (!profile || profile.status !== "ACTIVE") return {};
  const forceNoindex = profile.visibilityState === "PAUSED" || profile.visibilityState === "PROBATION";
  // Temel güvenilirlik kapısı — bkz. lib/expertNote.ts CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES notu.
  const publishedNoteCount = await prisma.expertNote.count({
    where: { profileId: profile.id, status: "PUBLISHED", removedAt: null },
  });
  const belowContactThreshold = publishedNoteCount < CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES;
  return {
    title: `${profile.headline ?? "Usta"} — Usta Profili | fikape`,
    description: `${profile.headline ?? "Usta"} — fikape'de usta profili ve teknik katkıları.`,
    robots: profile.cvNoindex || forceNoindex || belowContactThreshold ? { index: false } : undefined,
  };
}

// Usta profil sayfası — İletişim bölümü (b) rızası + en az bir alan girilmişse
// (contactVisible) VE en az CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES yayınlanmış
// notu varsa gösterilir (3 ajanlı panel kararı — 11 Eylül 2026: kimlik/belge
// doğrulaması olmadığı için hiç içerik üretmeden iletişim yayınlamayı önler,
// bkz. lib/expertNote.ts). Site-içi maskeli mesajlaşma (Aşama 6b) ayrıca ve
// HER ZAMAN mevcuttur (bu eşikten VE rızadan bağımsız — §7.2). Sayfa varlığı
// yalnız status=ACTIVE'e bağlı. Barem (Aşama 7) PAUSED/PROBATION üretirse veya
// eşik altındaysa: sayfa 200 kalır ama noindex olur ve iletişim bölümü
// gizlenir — notlar ve rozet her zaman görünür kalır (§14.13).
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
        status: true, createdAt: true, contactVisible: true, businessName: true, contactPhone: true, contactAddress: true,
        visibilityState: true, userId: true, messagingEnabled: true,
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
  const canMessage = !!viewerId && !isOwnProfile && !isBlocked && profile.messagingEnabled;

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

  const memberSince = profile.createdAt.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between gap-3 text-xs font-semibold text-gray-500 mb-6">
        <Link href="/" className="hover:text-gray-800 transition-colors">← Ana sayfaya dön</Link>
        <Link href="/usta-ol" className="hover:text-gray-800 transition-colors">Usta Görüşleri hakkında bilgi al →</Link>
      </div>

      {/* Kimlik kartı — önceden düz metin yığını, kart yapısı yoktu (kullanıcı
          "görünüm kötü" dedi). Not sayısı + üyelik tarihi somut bir güven
          sinyali ekliyor — "neden bu ustaya bakmalıyım" sorusuna kısa bir
          cevap (kullanıcı: "ilgi çekici değil, neden kullanmalıyım
          göstermiyor"). */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6">
        <span
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ color: EXPERT_BADGE.color, background: EXPERT_BADGE.bg }}
          title={EXPERT_BADGE.tooltip}
        >
          {EXPERT_BADGE.icon} {EXPERT_BADGE.label}
        </span>
        <h1 className="text-2xl font-black text-gray-900 mt-3">{profile.headline}</h1>
        <p className="text-sm text-gray-400 mt-1">
          {profile.user.displayName}
          {profile.city && ` · ${profile.city}`}
        </p>
        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-50 text-xs text-gray-500">
          <span className="font-semibold text-gray-700">{notes.length}</span> paylaşılan usta görüşü
          <span className="text-gray-300">·</span>
          {memberSince}&apos;den beri fikape&apos;de
        </div>
      </div>

      {(profile.expertiseTags.length > 0 || profile.bio) && (
        <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-6 space-y-5">
          {profile.expertiseTags.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Uzmanlık Alanları</p>
              <div className="flex flex-wrap gap-1.5">
                {profile.expertiseTags.map((t) => (
                  <span key={t} className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{t}</span>
                ))}
              </div>
            </div>
          )}

          {profile.bio && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-2">Hakkında</p>
              <p className="text-sm text-gray-700 whitespace-pre-line leading-relaxed">{profile.bio}</p>
            </div>
          )}
        </div>
      )}

      {!promotionPaused &&
        profile.contactVisible &&
        notes.length >= CONTACT_VISIBILITY_MIN_PUBLISHED_NOTES &&
        (profile.businessName || profile.contactPhone || profile.contactAddress) && (
        <div className="mb-8 bg-gray-50 rounded-xl p-4 space-y-1.5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">İletişim</p>
          {profile.businessName && <p className="text-sm font-semibold text-gray-900">🏢 {profile.businessName}</p>}
          {profile.contactPhone && <p className="text-sm text-gray-800">📞 {profile.contactPhone}</p>}
          {profile.contactAddress && (
            <div>
              <p className="text-sm text-gray-800">📍 {profile.contactAddress}</p>
              {/* Harita önizlemesi — API anahtarı gerektirmeyen Google Maps
                  embed URL şeması (kullanıcı isteği: adres yalnız metin değil,
                  görsel bir konum önizlemesi de sağlasın). */}
              <div className="mt-2 rounded-xl overflow-hidden border border-gray-100">
                <iframe
                  title="Konum haritası"
                  src={`https://www.google.com/maps?q=${encodeURIComponent(profile.contactAddress)}&output=embed`}
                  width="100%"
                  height="160"
                  loading="lazy"
                  style={{ border: 0, display: "block" }}
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
              {/* "Haritada Aç" önceden adres metninin ortasına sıkışmış inline
                  bir link gibiydi ("kötü gözüküyor") — artık haritanın altında,
                  kendi başına bir mini-buton. */}
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(profile.contactAddress)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-link hover:underline"
              >
                Google Maps&apos;te aç
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
            </div>
          )}
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
      {viewerId && !isOwnProfile && !isBlocked && !profile.messagingEnabled && (
        <p className="mb-8 text-xs text-gray-400">Bu usta şu anda site üzerinden mesaj almıyor.</p>
      )}

      <div>
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-3">
          Usta Görüşleri {notes.length > 0 && `(${notes.length})`}
        </p>
        {notes.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-8 text-center text-sm text-gray-400">
            {isOwnProfile
              ? <>Henüz bir usta görüşü paylaşmadınız. <Link href="/usta-gorusu/yaz" className="text-link font-semibold hover:underline">İlk görüşünüzü yazın →</Link></>
              : "Bu usta henüz bir görüş paylaşmamış."}
          </div>
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
