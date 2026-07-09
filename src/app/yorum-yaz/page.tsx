import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReviewForm } from "./ReviewForm";

export const metadata = { title: "Yorum Yaz — fikape" };

export default async function YorumYazPage({
  searchParams,
}: {
  searchParams: Promise<{ arac?: string; onay?: string }>;
}) {
  const session = await auth();
  if (!session) {
    redirect("/giris?callbackUrl=/yorum-yaz");
  }

  const { arac, onay } = await searchParams;

  if (onay === "bekliyor") {
    return (
      <div className="max-w-lg mx-auto px-4 py-20 text-center space-y-4">
        <div className="text-5xl">🕐</div>
        <h1 className="text-xl font-black text-gray-900">Talebiniz alındı!</h1>
        <p className="text-sm text-gray-500 leading-relaxed">
          Araç öneriniz ve yorumunuz incelemeye alındı.
          Onaylandıktan sonra yayınlanacak ve size bildirim gönderilecek.
        </p>
        <a
          href="/"
          className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#111" }}
        >
          Ana sayfaya dön →
        </a>
      </div>
    );
  }
  const userId = parseInt(session.user.id);

  const [dbUser, existingReviews] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { emailVerifiedAt: true },
    }),
    prisma.review.findMany({
      where: { userId, status: { in: ["PENDING", "PUBLISHED"] } },
      select: { product: { select: { slug: true } } },
    }),
  ]);

  const emailVerified = !!dbUser?.emailVerifiedAt;
  const reviewedSlugs = existingReviews.map((r) => r.product.slug);

  const products = await prisma.product.findMany({
    where: {
      OR: [
        { isActive: true },
        // PENDING ürün: öneri akışından gelen slug ile doğrudan yorum yazılabilir
        ...(arac ? [{ slug: arac, status: "PENDING" as const }] : []),
      ],
    },
    select: {
      slug: true,
      name: true,
      trimName: true,
      year: true,
      imageUrl: true,
      attributes: true,
      category: { select: { slug: true } },
      model: {
        select: {
          name: true,
          brand: { select: { name: true } },
        },
      },
    },
    orderBy: [
      { model: { brand: { name: "asc" } } },
      { model: { name: "asc" } },
      { name: "asc" },
    ],
  });

  const mapped = products.map((p) => {
    const attrs = p.attributes as Record<string, unknown>;
    return {
      slug:         p.slug,
      name:         p.name,
      brandName:    p.model.brand.name,
      modelName:    p.model.name,
      trimName:     p.trimName ?? null,
      year:         p.year ?? null,
      imageUrl:     p.imageUrl ?? null,
      fuelType:     (attrs.fuel_type as string | undefined) ?? null,
      bodyType:     (attrs.body_type as string | undefined) ?? null,
      transmission: (attrs.transmission as string | undefined) ?? null,
      categorySlug: p.category?.slug ?? null,
    };
  });

  if (!emailVerified) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="text-4xl mb-4">✉️</div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">E-posta doğrulaması gerekiyor</h1>
        <p className="text-sm text-gray-500 leading-relaxed mb-6">
          Yorum yazmak için hesabınızı doğrulamanız gerekiyor.
          Kayıt sırasında gönderilen e-postayı kontrol edin.
        </p>
        <a
          href="/profil"
          className="inline-block px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
          style={{ background: "#111" }}
        >
          Profil sayfasına git →
        </a>
      </div>
    );
  }

  return <ReviewForm products={mapped} defaultSlug={arac} reviewedSlugs={reviewedSlugs} />;
}
