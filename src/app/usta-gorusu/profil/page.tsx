import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getLatestConsent } from "@/lib/consent";
import { ContactSettingsForm } from "./ContactSettingsForm";

export const metadata = { title: "İletişim Ayarları — fikape", robots: { index: false } };

export default async function ExpertContactSettingsPage() {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-gorusu/profil");

  const userId = parseInt(session.user.id);
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { status: true, slug: true, contactPhone: true, contactAddress: true, cvNoindex: true, city: true, district: true },
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

  const [consentContactPublic, consentRegionalPromo] = await Promise.all([
    getLatestConsent(userId, "EXPERT_CONTACT_PUBLIC"),
    getLatestConsent(userId, "EXPERT_REGIONAL_PROMO"),
  ]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-gray-900">İletişim ve Görünürlük Ayarları</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bu ayarlar profil sayfanızda ({profile.city ?? "—"}
          {profile.district ? ` / ${profile.district}` : ""}) hangi bilgilerin görüneceğini belirler.
        </p>
      </div>

      <ContactSettingsForm
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
