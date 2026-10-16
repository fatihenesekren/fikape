import { adminSayfaKorumasi } from "@/lib/adminAuth";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { urunPasifMi } from "@/lib/urunDurumu";
import { AltMenu } from "./AltMenu";
import { KATEGORI_ETIKETI } from "./istek";

export const metadata = { title: "Katalog Yönetimi — Admin" };
export const dynamic = "force-dynamic";

const SAYFA = 50;

export default async function KatalogListePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; durum?: string; s?: string }>;
}) {
  await adminSayfaKorumasi();
  const { q = "", durum = "tum", s } = await searchParams;
  const sayfa = Math.max(1, Number.parseInt(s ?? "1", 10) || 1);
  const arama = q.trim().slice(0, 80);

  const where = {
    ...(durum === "pasif" ? { status: "ACTIVE" as const, isActive: false } : {}),
    ...(durum === "aktif" ? { status: "ACTIVE" as const, isActive: true } : {}),
    ...(durum === "bekleyen" ? { status: "PENDING" as const } : {}),
    ...(durum === "reddedilen" ? { status: "REJECTED" as const } : {}),
    ...(arama
      ? {
          OR: [
            { name: { contains: arama, mode: "insensitive" as const } },
            { slug: { contains: arama, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [urunler, toplam, durumSayilari] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true, slug: true, status: true, isActive: true, category: { select: { slug: true } } },
      orderBy: { id: "desc" },
      skip: (sayfa - 1) * SAYFA,
      take: SAYFA,
    }),
    prisma.product.count({ where }),
    // Durumlar birbirini dışlar ve toplamı verir: yayında + pasif + bekleyen + reddedilen = tüm kayıtlar (aramadan bağımsız).
    prisma.product.groupBy({ by: ["status", "isActive"], _count: { _all: true } }),
  ]);
  const say = (f: (g: { status: string; isActive: boolean }) => boolean) =>
    durumSayilari.filter(f).reduce((t, g) => t + g._count._all, 0);
  const sayilar = {
    aktif: say((g) => g.status === "ACTIVE" && g.isActive),
    pasif: say((g) => g.status === "ACTIVE" && !g.isActive),
    bekleyen: say((g) => g.status === "PENDING"),
    reddedilen: say((g) => g.status === "REJECTED"),
  };
  const tumKayit = sayilar.aktif + sayilar.pasif + sayilar.bekleyen + sayilar.reddedilen;
  const DURUMLAR = [
    { anahtar: "tum", etiket: "Tümü", adet: tumKayit },
    { anahtar: "aktif", etiket: "Yayında", adet: sayilar.aktif },
    { anahtar: "pasif", etiket: "Pasif", adet: sayilar.pasif },
    { anahtar: "bekleyen", etiket: "Bekleyen", adet: sayilar.bekleyen },
    { anahtar: "reddedilen", etiket: "Reddedilen", adet: sayilar.reddedilen },
  ];
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA));
  const link = (p: number, d = durum) => `/admin/katalog?q=${encodeURIComponent(arama)}&durum=${d}&s=${p}`;

  return (
    <div className="px-4 sm:px-8 py-10 max-w-4xl">
      <AltMenu aktif="/admin/katalog" />

      <form className="flex flex-col sm:flex-row gap-2 mb-4" action="/admin/katalog">
        <input
          name="q" defaultValue={arama} placeholder="Araç adı veya adresi ara…"
          className="flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select name="durum" defaultValue={durum} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="tum">Tümü</option>
          <option value="aktif">Yayında</option>
          <option value="pasif">Pasif (katalogdan kaldırılmış)</option>
          <option value="bekleyen">Bekleyen öneri</option>
          <option value="reddedilen">Reddedilen öneri</option>
        </select>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">Ara</button>
      </form>

      <div className="flex flex-wrap gap-2 mb-3">
        {DURUMLAR.map((d) => (
          <Link
            key={d.anahtar}
            href={link(1, d.anahtar)}
            className={`px-3 py-1 rounded-full text-xs font-medium border ${
              durum === d.anahtar ? "bg-gray-900 text-white border-gray-900" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}
          >
            {d.etiket} <span className={durum === d.anahtar ? "text-gray-300" : "text-gray-400"}>{d.adet.toLocaleString("tr-TR")}</span>
          </Link>
        ))}
      </div>

      <p className="text-xs text-gray-400 mb-3">{toplam.toLocaleString("tr-TR")} kayıt{arama ? ` ("${arama}" araması)` : ""}</p>
      <ul className="divide-y divide-gray-100 bg-white border border-gray-100 rounded-xl">
        {urunler.map((u) => (
          <li key={u.id}>
            <Link href={`/admin/katalog/${u.id}`} className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{u.name}</p>
                <p className="text-xs text-gray-400 truncate">
                  {KATEGORI_ETIKETI[u.category?.slug ?? ""] ?? u.category?.slug} · {u.slug}
                </p>
              </div>
              {urunPasifMi(u) && <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Pasif</span>}
              {u.status === "PENDING" && <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">Bekliyor</span>}
              {u.status === "REJECTED" && <span className="shrink-0 text-[11px] px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">Reddedildi</span>}
            </Link>
          </li>
        ))}
        {urunler.length === 0 && <li className="px-4 py-8 text-sm text-gray-400 text-center">Sonuç yok.</li>}
      </ul>

      {sayfaSayisi > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm">
          {sayfa > 1 ? <Link href={link(sayfa - 1)} className="text-gray-700 hover:underline">← Önceki</Link> : <span />}
          <span className="text-gray-400">{sayfa} / {sayfaSayisi}</span>
          {sayfa < sayfaSayisi ? <Link href={link(sayfa + 1)} className="text-gray-700 hover:underline">Sonraki →</Link> : <span />}
        </div>
      )}
    </div>
  );
}
