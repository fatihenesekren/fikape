import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ExpertNoteForm } from "./ExpertNoteForm";

export const metadata = { title: "Usta Görüşü Yaz — fikape", robots: { index: false } };

export default async function UstaGorusuYazPage({
  searchParams,
}: {
  searchParams: Promise<{ gonderildi?: string }>;
}) {
  const session = await auth();
  if (!session) redirect("/giris?callbackUrl=/usta-gorusu/yaz");

  const { gonderildi } = await searchParams;
  if (gonderildi === "1") {
    return (
      <Shell>
        <div className="text-4xl">✅</div>
        <h1 className="text-xl font-black text-gray-900">Notunuz alındı</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Usta notunuz incelemeye alındı. Onaylandığında ilgili araç sayfasında
          yayınlanacak ve size bildirim göndereceğiz.
        </p>
        <Link href="/usta-gorusu/yaz" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
          Yeni not yaz →
        </Link>
      </Shell>
    );
  }

  const userId = parseInt(session.user.id);
  const profile = await prisma.expertProfile.findUnique({
    where: { userId },
    select: { status: true, headline: true },
  });

  if (!profile) {
    return (
      <Shell>
        <div className="text-4xl">🔧</div>
        <h1 className="text-xl font-black text-gray-900">Usta Görüşü için başvuru gerekli</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Usta görüşü yazabilmek için önce profilinizden usta başvurusu yapıp
          onay almanız gerekiyor.
        </p>
        <Link href="/profil" className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white" style={{ background: "#111" }}>
          Profile git →
        </Link>
      </Shell>
    );
  }

  if (profile.status === "PENDING_VERIFICATION" || profile.status === "WAITLISTED") {
    return (
      <Shell>
        <div className="text-4xl">🕐</div>
        <h1 className="text-xl font-black text-gray-900">Başvurunuz inceleniyor</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Usta başvurunuz onaylandığında size bildirim göndereceğiz. Onay sonrası
          bu sayfadan usta görüşü yazabilirsiniz.
        </p>
      </Shell>
    );
  }

  if (profile.status !== "ACTIVE") {
    return (
      <Shell>
        <div className="text-4xl">⛔</div>
        <h1 className="text-xl font-black text-gray-900">Usta görüşü yazamıyorsunuz</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Usta profiliniz şu anda aktif değil. Sorularınız için bizimle iletişime geçebilirsiniz.
        </p>
      </Shell>
    );
  }

  return <ExpertNoteForm headline={profile.headline} />;
}

function Shell({ children }: { children: React.ReactNode }) {
  return <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">{children}</div>;
}
