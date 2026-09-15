import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { hammingDistance, PHASH_DUPLICATE_THRESHOLD } from "@/lib/phash";
import { ExpertWorkplacePhotoActions } from "./ExpertWorkplacePhotoActions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Usta Fotoğrafları — Admin",
  robots: { index: false },
};

const KIND_LABEL: Record<string, string> = {
  STOREFRONT: "Tabela/Giriş",
  INTERIOR: "İç Mekan",
};

export default async function UstaFotograflariPage() {
  const pending = await prisma.expertWorkplacePhoto.findMany({
    where: { status: "PENDING" },
    orderBy: { createdAt: "asc" },
    select: {
      id: true, url: true, kind: true, phash: true, createdAt: true,
      profile: { select: { id: true, slug: true, headline: true, user: { select: { displayName: true } } } },
    },
  });

  // Tekrar tespiti GLOBAL — takastan farklı olarak burada "aynı ürün" gibi bir
  // sınır yok, amaç iki FARKLI ustanın aynı fotoğrafı (ör. internetten
  // bulunmuş bir görsel) "benim işletmem" diye yüklemesini yakalamak (bkz.
  // güven & güvenlik ajanı bulgusu "a" senaryosu). PENDING+APPROVED tüm
  // kayıtlarla karşılaştırılır.
  const allHashed = await prisma.expertWorkplacePhoto.findMany({
    where: { status: { in: ["PENDING", "APPROVED"] }, phash: { not: null } },
    select: { id: true, phash: true, profileId: true },
  });
  function findDuplicateProfile(photoId: number, profileId: number, phash: string | null): string | null {
    if (!phash) return null;
    const match = allHashed.find(
      (o) => o.id !== photoId && o.profileId !== profileId && o.phash && hammingDistance(o.phash, phash) <= PHASH_DUPLICATE_THRESHOLD,
    );
    return match ? "başka bir usta profilindeki fotoğrafla eşleşiyor olabilir" : null;
  }

  return (
    <div className="px-4 sm:px-8 py-10 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
          Usta Fotoğrafları
          {pending.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-sm font-bold bg-orange-100 text-orange-700">
              {pending.length} bekliyor
            </span>
          )}
        </h1>
        <p className="text-sm text-gray-400 mt-1">
          Usta profillerine eklenen çalışma yeri (tabela/iç mekan) fotoğrafları. Plaka / yüz / kişisel
          belge / iletişim bilgisi / reklam-promosyon içerenleri reddediniz; &quot;tekrar olabilir&quot;
          rozetli fotoğrafları başka ustanın profiliyle karşılaştırınız.
        </p>
      </div>

      {pending.length === 0 ? (
        <p className="text-sm text-gray-400">Bekleyen fotoğraf yok.</p>
      ) : (
        <div className="space-y-3">
          {pending.map((p) => {
            const dupWarning = findDuplicateProfile(p.id, p.profile.id, p.phash);
            return (
              <div key={p.id} className="bg-white border border-gray-100 rounded-xl p-4 flex gap-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.url} alt="" className="w-32 h-32 rounded-lg object-cover shrink-0 bg-gray-100" />
                <div className="min-w-0 flex-1 flex flex-col">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/usta/${p.profile.slug}`} className="font-semibold text-gray-800 hover:underline truncate">
                      {p.profile.headline ?? p.profile.user.displayName ?? "Usta"}
                    </Link>
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-600">
                      {KIND_LABEL[p.kind] ?? p.kind}
                    </span>
                    {dupWarning && (
                      <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-100 text-red-700" title={dupWarning}>
                        tekrar olabilir
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {p.profile.user.displayName ?? "Kullanıcı"} yükledi ·{" "}
                    {p.createdAt.toLocaleDateString("tr-TR", { day: "numeric", month: "long" })}
                  </p>
                  <div className="mt-auto pt-3 flex items-center justify-between gap-2">
                    <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:underline">
                      Büyük görüntüle →
                    </a>
                    <ExpertWorkplacePhotoActions photoId={p.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
