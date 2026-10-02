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
  const { q = "", durum = "tum", s } = await searchParams;
  const sayfa = Math.max(1, Number.parseInt(s ?? "1", 10) || 1);
  const arama = q.trim().slice(0, 80);

  const where = {
    ...(durum === "pasif" ? { status: "ACTIVE" as const, isActive: false } : {}),
    ...(durum === "aktif" ? { status: "ACTIVE" as const, isActive: true } : {}),
    ...(durum === "bekleyen" ? { status: "PENDING" as const } : {}),
    ...(arama
      ? {
          OR: [
            { name: { contains: arama, mode: "insensitive" as const } },
            { slug: { contains: arama, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [urunler, toplam] = await Promise.all([
    prisma.product.findMany({
      where,
      select: { id: true, name: true, slug: true, status: true, isActive: true, category: { select: { slug: true } } },
      orderBy: { id: "desc" },
      skip: (sayfa - 1) * SAYFA,
      take: SAYFA,
    }),
    prisma.product.count({ where }),
  ]);
  const sayfaSayisi = Math.max(1, Math.ceil(toplam / SAYFA));
  const link = (p: number) => `/admin/katalog?q=${encodeURIComponent(arama)}&durum=${durum}&s=${p}`;

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
        </select>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">Ara</button>
      </form>

      <p className="text-xs text-gray-400 mb-3">{toplam} kayıt</p>
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
