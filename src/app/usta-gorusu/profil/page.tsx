import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLatestConsent } from "@/lib/consent";
import { finalizeExpiredAppeals } from "@/lib/expertAppeal";
import { ContactSettingsForm } from "./ContactSettingsForm";
import { ExpertAppealForm } from "../ExpertAppealForm";
import { EXPERT_STATUS_TONES } from "@/lib/expertNote";

export const metadata = { title: "Profil Ayarları — fikape", robots: { index: false } };

const VISIBILITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  HIDDEN: { label: "Henüz görünür değil", ...EXPERT_STATUS_TONES.neutral },
  FEATURED: { label: "Görünür", ...EXPERT_STATUS_TONES.success },
  PAUSED: { label: "Duraklatıldı", ...EXPERT_STATUS_TONES.danger },
  PROBATION: { label: "Denetimde", ...EXPERT_STATUS_TONES.warning },
};

export default async function ExpertContactSettingsPage() {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-gorusu/profil");

  const userId = parseInt(session.user.id);
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: {
      id: true, status: true, slug: true, businessName: true, contactPhone: true, contactAddress: true,
      cvNoindex: true, city: true, district: true, visibilityState: true, messagingEnabled: true, expertiseTags: true,
      headline: true, bio: true,
    },
  });

  if (!profile || profile.status !== "ACTIVE") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-4xl">🔧</div>
        <h1 className="text-xl font-black text-gray-900">Bu sayfa yalnızca aktif ustalar içindir</h1>
        <Link href="/profil" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
          Profile dön →
        </Link>
      </div>
    );
  }

  await finalizeExpiredAppeals();

  const [consentContactPublic, consentRegionalPromo, consentWorkplacePhoto, latestPausedSnapshot, workplacePhotos] = await Promise.all([
    getLatestConsent(userId, "EXPERT_CONTACT_PUBLIC"),
    getLatestConsent(userId, "EXPERT_REGIONAL_PROMO"),
    getLatestConsent(userId, "EXPERT_WORKPLACE_PHOTO"),
    profile.visibilityState === "PAUSED"
      ? prisma.expertScoreSnapshot.findFirst({
          where: { profileId: profile.id, decision: "PAUSED" },
          orderBy: { period: "desc" },
          select: { period: true },
        })
      : Promise.resolve(null),
    // REJECTED de gösterilir (PhotoUploader zaten yalnız id+url alıyor) —
    // usta reddedilen bir fotoğrafı da kaldırabilsin diye ayrı bir "sessizce
    // kaybolmuş" durum yaşanmasın.
    prisma.expertWorkplacePhoto.findMany({
      where: { profileId: profile.id, status: { not: "REJECTED" } },
      orderBy: { createdAt: "asc" },
      select: { id: true, url: true, kind: true },
    }),
  ]);

  const pausedAppeal = latestPausedSnapshot
    ? await prisma.expertAppeal.findUnique({
        where: { profileId_period: { profileId: profile.id, period: latestPausedSnapshot.period } },
        select: { status: true },
      })
    : null;

  const visBadge = VISIBILITY_LABEL[profile.visibilityState] ?? { label: profile.visibilityState, ...EXPERT_STATUS_TONES.neutral };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <Link href="/profil" className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-800">
        ← Profilime dön
      </Link>

      <div>
        {/* Önceden yalnız "İletişim ve Görünürlük Ayarları" idi — başlık/bio/il/ilçe
            başvuru formunda BİR KEZ girilip sonrasında hiç düzenlenemiyordu, sayfa
            adı da bunu yansıtmıyordu (kullanıcı fark etti: "2 gün sonra usta
            uzmanlık alanı eklemek istese ne yapacak?"). Artık tüm profil buradan
            yönetiliyor. */}
        <h1 className="text-2xl font-black text-gray-900">Profil Ayarları</h1>
        <p className="text-sm text-gray-500 mt-1.5 leading-relaxed">
          Başlık, il/ilçe ve kendinizi tanıttığınız yazı dahil profilinizin herkese açık
          hâli buradan yönetilir; uzmanlık alanlarıyla birlikte her zaman görünürler.
          İşyeri adı, telefon ve adres ise yalnız aşağıda açıkça izin verirseniz gösterilir.
          O alanları doldurmak zorunda değilsiniz — boş bıraktığınız hiçbir bilgi paylaşılmaz.
        </p>
      </div>

      {/* Bölgesel görünürlük durumu + itiraz (barem kararı) */}
      <div className="bg-white border border-gray-100 rounded-xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wide">Bölgesel Görünürlük Durumu</p>
          <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold" style={{ color: visBadge.color, background: visBadge.bg }}>
            {visBadge.label}
          </span>
        </div>
        {profile.visibilityState === "PAUSED" && latestPausedSnapshot && (
          <>
            <p className="text-xs text-gray-500 leading-relaxed">
              Görünürlüğünüz gerçek katkı ve faydalı bulunma verilerine göre aylık olarak yeniden
              değerlendirilir; katkılarınızı sürdürdükçe otomatik olarak yeniden açılabilir.
            </p>
            <ExpertAppealForm
              subjectType="VISIBILITY_DECISION"
              period={latestPausedSnapshot.period}
              existingStatus={pausedAppeal?.status ?? null}
            />
          </>
        )}
      </div>

      <ContactSettingsForm
        initialHeadline={profile.headline ?? ""}
        initialBio={profile.bio ?? ""}
        initialCity={profile.city ?? ""}
        initialDistrict={profile.district ?? ""}
        initialBusinessName={profile.businessName}
        initialPhone={profile.contactPhone}
        initialAddress={profile.contactAddress}
        initialConsentContactPublic={consentContactPublic ?? false}
        initialConsentRegionalPromo={consentRegionalPromo ?? false}
        initialCvNoindex={profile.cvNoindex}
        initialMessagingEnabled={profile.messagingEnabled}
        initialExpertiseTags={profile.expertiseTags}
        profileSlug={profile.slug}
        initialConsentWorkplacePhoto={consentWorkplacePhoto ?? false}
        initialStorefrontPhotos={workplacePhotos.filter((p) => p.kind === "STOREFRONT").map((p) => ({ id: p.id, url: p.url }))}
        initialInteriorPhotos={workplacePhotos.filter((p) => p.kind === "INTERIOR").map((p) => ({ id: p.id, url: p.url }))}
      />
    </div>
  );
}
