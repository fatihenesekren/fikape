import type { Metadata } from "next";
import Link from "next/link";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PlusBoard } from "./PlusBoard";
import { IdeaBox } from "./IdeaBox";

export const metadata: Metadata = {
  title: "Fikape Plus",
  description: "fikape'yi birlikte şekillendiriyoruz — ilgini çeken fikirleri işaretle, önceliğimizi senin seçimlerin belirlesin.",
};

export default async function PlusPage() {
  const session = await auth();
  const userId = session?.user?.id ? Number(session.user.id) : null;

  const initialVotes = userId
    ? (
        await prisma.plusInterestVote.findMany({
          where: { userId },
          select: { interestKey: true },
        })
      ).map((v) => v.interestKey)
    : [];

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="mb-8">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Ana sayfaya dön
        </Link>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Fikape Plus</h1>
      <p className="text-sm text-gray-500 mb-10 max-w-2xl">
        fikape&apos;yi birlikte şekillendiriyoruz. Aşağıdaki fikirlerden ilgini çekenleri işaretle,
        yol haritamızı senin seçimlerin şekillendirsin. Şu an ve öngörülebilir gelecekte fikape&apos;nin
        temel özellikleri ücretsiz kalacak — Plus, ücretli bir katman değil, birlikte karar verdiğimiz bir yol haritası.
      </p>

      <PlusBoard initialVotes={initialVotes} isLoggedIn={Boolean(userId)} />

      <div className="mt-12 pt-8 border-t border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Listede olmayan bir fikrin mi var?</h2>
        <p className="text-sm text-gray-500 mb-4">Bize yaz, değerlendirelim.</p>
        <IdeaBox defaultEmail={session?.user?.email ?? ""} />
      </div>
    </div>
  );
}
