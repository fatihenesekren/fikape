import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLatestConsent } from "@/lib/consent";
import { finalizeExpiredAppeals } from "@/lib/expertAppeal";
import { ContactSettingsForm } from "./ContactSettingsForm";
import { ExpertAppealForm } from "../ExpertAppealForm";

export const metadata = { title: "İletişim Ayarları — fikape", robots: { index: false } };

const VISIBILITY_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  HIDDEN: { label: "Henüz görünür değil", color: "#374151", bg: "#F3F4F6" },
  FEATURED: { label: "Görünür", color: "#166534", bg: "#DCFCE7" },
  PAUSED: { label: "Duraklatıldı", color: "#991B1B", bg: "#FEE2E2" },
  PROBATION: { label: "Denetimde", color: "#7A5A00", bg: "#FEF6D8" },
};

export default async function ExpertContactSettingsPage() {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-gorusu/profil");

  const userId = parseInt(session.user.id);
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: {
      id: true, status: true, slug: true, businessName: true, contactPhone: true, contactAddress: true,
      cvNoindex: true, city: true, district: true, visibilityState: true,
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

  const [consentContactPublic, consentRegionalPromo, latestPausedSnapshot] = await Promise.all([
    getLatestConsent(userId, "EXPERT_CONTACT_PUBLIC"),
    getLatestConsent(userId, "EXPERT_REGIONAL_PROMO"),
    profile.visibilityState === "PAUSED"
      ? prisma.expertScoreSnapshot.findFirst({
          where: { profileId: profile.id, decision: "PAUSED" },
          orderBy: { period: "desc" },
          select: { period: true },
        })
      : Promise.resolve(null),
  ]);

  const pausedAppeal = latestPausedSnapshot
    ? await prisma.expertAppeal.findUnique({
        where: { profileId_period: { profileId: profile.id, period: latestPausedSnapshot.period } },
        select: { status: true },
      })
    : null;

  const visBadge = VISIBILITY_LABEL[profile.visibilityState] ?? { label: profile.visibilityState, color: "#374151", bg: "#F3F4F6" };

  return (
    <div className="max-w-2xl mx-auto px-4 py-10 space-y-8">
      <div>
        <h1 className="text-2xl font-black text-gray-900">İletişim ve Görünürlük Ayarları</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bu ayarlar profil sayfanızda ({profile.city ?? "—"}
          {profile.district ? ` / ${profile.district}` : ""}) hangi bilgilerin görüneceğini belirler.
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
        initialBusinessName={profile.businessName}
        initialPhone={profile.contactPhone}
        initialAddress={profile.contactAddress}
        initialConsentContactPublic={consentContactPublic ?? false}
        initialConsentRegionalPromo={consentRegionalPromo ?? false}
        initialCvNoindex={profile.cvNoindex}
        profileSlug={profile.slug}
      />
    </div>
  );
}
