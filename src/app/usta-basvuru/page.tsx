import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExpertApplicationForm } from "./ExpertApplicationForm";

export const metadata = { title: "Usta Başvurusu — fikape", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-4">{children}</div>;
}

// Sayfanın HER durumunda (form, bekleme ekranı, hata ekranı) ortak üst
// gezinme — kullanıcı geri bildirimi: önceden hiçbir ekranda ana sayfaya
// veya tanıtım sayfasına dönüş yolu yoktu (13 Eylül 2026).
function TopLinks() {
  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 flex items-center justify-between gap-3 text-xs font-semibold text-gray-500">
      <Link href="/" className="hover:text-gray-800 transition-colors">← Ana sayfaya dön</Link>
      <Link href="/usta-ol" className="hover:text-[var(--link)] transition-colors">Usta Görüşleri hakkında bilgi al</Link>
    </div>
  );
}

export default async function UstaBasvuruPage({
  searchParams,
}: {
  searchParams: Promise<{ gonderildi?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-basvuru");

  const { gonderildi } = await searchParams;
  if (gonderildi) {
    return (
      <>
        <TopLinks />
        <Shell>
          <div className="text-4xl">{gonderildi === "waitlisted" ? "🕐" : "✅"}</div>
          <h1 className="text-xl font-black text-gray-900">
            {gonderildi === "waitlisted" ? "Başvurunuz bekleme listesinde" : "Başvurunuz alındı"}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            {gonderildi === "waitlisted"
              ? "Başvuru penceresi şu anda kapalı. Başvurunuz kaydedildi ve sıradaki pencerede otomatik değerlendirmeye alınacak."
              : "Usta başvurunuz incelemeye alındı. Onaylandığında size bildirim göndereceğiz."}
          </p>
          <Link href="/profil" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
            Profile dön →
          </Link>
        </Shell>
      </>
    );
  }

  const userId = parseInt(session.user.id);
  const [dbUser, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
    prisma.expertProfile.findUnique({ where: { userId }, select: { status: true, slug: true } }),
  ]);

  if (!dbUser?.emailVerifiedAt) {
    return (
      <>
        <TopLinks />
        <Shell>
          <div className="text-4xl">✉️</div>
          <h1 className="text-xl font-black text-gray-900">E-posta doğrulaması gerekli</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Usta başvurusu yapmadan önce e-posta adresinizi doğrulamanız gerekiyor.
          </p>
        </Shell>
      </>
    );
  }

  if (existing && existing.status !== "CLOSED") {
    if (existing.status === "ACTIVE") {
      return (
        <>
          <TopLinks />
          <Shell>
            <div className="text-4xl">🔧</div>
            <h1 className="text-xl font-black text-gray-900">Zaten aktif bir usta profiliniz var</h1>
            <Link href={`/usta/${existing.slug}`} className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
              Profilime git →
            </Link>
          </Shell>
        </>
      );
    }
    return (
      <>
        <TopLinks />
        <Shell>
          <div className="text-4xl">🕐</div>
          <h1 className="text-xl font-black text-gray-900">
            {existing.status === "WAITLISTED" ? "Başvurunuz bekleme listesinde" : "Başvurunuz inceleniyor"}
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            Bir karar verildiğinde size bildirim göndereceğiz.
          </p>
        </Shell>
      </>
    );
  }

  return (
    <>
      <TopLinks />
      <ExpertApplicationForm />
    </>
  );
}
