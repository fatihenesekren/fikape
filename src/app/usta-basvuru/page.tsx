import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExpertApplicationForm } from "./ExpertApplicationForm";

export const metadata = { title: "Usta Başvurusu — fikape", robots: { index: false } };

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">{children}</div>;
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
    );
  }

  const userId = parseInt(session.user.id);
  const [dbUser, existing] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerifiedAt: true } }),
    prisma.expertProfile.findUnique({ where: { userId }, select: { status: true, slug: true } }),
  ]);

  if (!dbUser?.emailVerifiedAt) {
    return (
      <Shell>
        <div className="text-4xl">✉️</div>
        <h1 className="text-xl font-black text-gray-900">E-posta doğrulaması gerekli</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Usta başvurusu yapmadan önce e-posta adresinizi doğrulamanız gerekiyor.
        </p>
      </Shell>
    );
  }

  if (existing && existing.status !== "CLOSED") {
    if (existing.status === "ACTIVE") {
      return (
        <Shell>
          <div className="text-4xl">🔧</div>
          <h1 className="text-xl font-black text-gray-900">Zaten aktif bir usta profiliniz var</h1>
          <Link href={`/usta/${existing.slug}`} className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
            Profilime git →
          </Link>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="text-4xl">🕐</div>
        <h1 className="text-xl font-black text-gray-900">
          {existing.status === "WAITLISTED" ? "Başvurunuz bekleme listesinde" : "Başvurunuz inceleniyor"}
        </h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Bir karar verildiğinde size bildirim göndereceğiz.
        </p>
      </Shell>
    );
  }

  return <ExpertApplicationForm />;
}
