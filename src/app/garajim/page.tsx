import { redirect } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { FUEL_LABELS, FUEL_ICONS, FUEL_COLORS } from "@/lib/fuel";
import { calcOverall } from "@/lib/fikape";
import { GarageAnimation } from "./GarageAnimation";

export const metadata: Metadata = { title: "Garajım" };

const BODY_LABELS: Record<string, string> = {
  sedan: "Sedan", suv: "SUV", hatchback: "Hatchback",
  mpv: "MPV", coupe: "Coupe", cabrio: "Cabriolet",
};

export default async function GarajimPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/giris");

  const userId = Number(session.user.id);

  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true, email: true },
  });

  const userName = currentUser?.displayName || currentUser?.email?.split("@")[0] || "Sürücü";

  const userProducts = await prisma.userProduct.findMany({
    where: { userId },
    include: {
      product: {
        include: { brand: true, model: true },
      },
      reviews: {
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 1,
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <GarageAnimation userName={userName} />

      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Garajım</h1>
        <p className="text-sm text-gray-500 mt-1">
          Sahip olduğun veya kullandığın araçlar
        </p>
      </div>

      {userProducts.length === 0 ? (
        <div className="bg-white border-2 border-dashed border-gray-100 rounded-2xl p-12 text-center space-y-3">
          <div className="text-4xl">🚗</div>
          <p className="font-semibold text-gray-800">Henüz araç eklemedin</p>
          <p className="text-sm text-gray-400">
            Araç sayfasında "Bu araç benim" butonuna tıklayarak garajına ekleyebilirsin.
          </p>
          <Link
            href="/"
            className="inline-block mt-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{ background: "#111" }}
          >
            Araçları gör →
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {userProducts.map(({ product, reviews }) => {
            const attrs = product.attributes as Record<string, unknown>;
            const fuelType = String(attrs.fuel_type ?? "");
            const bodyType = String(attrs.body_type ?? "sedan");
            const fuelColor = FUEL_COLORS[fuelType] ?? FUEL_COLORS.GASOLINE;
            const review = reviews[0] ?? null;

            return (
              <div
                key={product.id}
                className="bg-white border border-gray-100 rounded-2xl p-5 flex gap-4 items-start"
              >
                {/* Araç fotoğrafı */}
                <div
                  className="w-24 h-20 rounded-xl overflow-hidden shrink-0 flex items-center justify-center text-2xl"
                  style={{ background: fuelType === "EV" ? "#0d1117" : "#f3f4f6" }}
                >
                  {product.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    "🚗"
                  )}
                </div>

                {/* Bilgiler */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                    {product.brand.name}
                  </div>
                  <div className="font-bold text-gray-900">
                    {product.model.name}
                    {product.year && (
                      <span className="text-gray-400 font-normal ml-1.5">{product.year}</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    <span
                      className="text-xs font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: fuelColor.bg, color: fuelColor.text }}
                    >
                      {FUEL_ICONS[fuelType]} {FUEL_LABELS[fuelType] ?? fuelType}
                    </span>
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                      {BODY_LABELS[bodyType] ?? bodyType}
                    </span>
                  </div>

                  {/* Yorum durumu */}
                  <div className="mt-3">
                    {review ? (
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-green-600 font-semibold">
                          ✓ Yorum yazdın — {calcOverall(review).toFixed(1)} fi·ka·pe
                        </span>
                      </div>
                    ) : (
                      <Link
                        href={`/yorum-yaz?arac=${product.slug}`}
                        className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-900 hover:underline"
                      >
                        Yorum yaz →
                      </Link>
                    )}
                  </div>
                </div>

                {/* Araç sayfası linki */}
                <Link
                  href={`/araclar/${product.slug}`}
                  className="shrink-0 text-xs font-semibold text-gray-400 hover:text-gray-700 transition-colors"
                >
                  Sayfaya git →
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
