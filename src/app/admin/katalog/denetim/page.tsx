import Link from "next/link";
import { adminSayfaKorumasi } from "@/lib/adminAuth";
import { prisma } from "@/lib/prisma";
import { AltMenu } from "../AltMenu";
import { ADMIN_EYLEM_ETIKETI } from "@/lib/adminEylemKaydi";
import { ROZET_SINIFI, TARIH_SECENEKLERI, eylemRengi, kisaZaman, tarihAltSiniri } from "@/lib/denetimGoruntu";

export const metadata = { title: "Denetim Kaydı — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

const EYLEM_ETIKETI: Record<string, string> = {
  PRODUCT_CREATE: "Araç eklendi", PRODUCT_UPDATE: "Araç düzeltildi", PRODUCT_DEACTIVATE: "Araç pasife alındı",
  PRODUCT_REACTIVATE: "Araç geri alındı", PRODUCT_DELETE: "Araç silindi",
  BRAND_RENAME: "Marka yeniden adlandırıldı", MODEL_RENAME: "Model yeniden adlandırıldı",
  BRAND_MERGE: "Markalar birleştirildi", MODEL_MERGE: "Modeller birleştirildi", MODEL_DELETE: "Boş model silindi",
  OVERRIDE_HIDE: "Resmi katalogdan gizlendi", OVERRIDE_RESTORE: "Gizleme kaldırıldı",
  CACHE_TEMIZLE: "Önbellek temizlendi",
  ...ADMIN_EYLEM_ETIKETI,
};

const SAYFA = 25;

type Sorgu = { q?: string; islem?: string; tarih?: string; s?: string };

export default async function DenetimPage({ searchParams }: { searchParams: Promise<Sorgu> }) {
  await adminSayfaKorumasi();
  const { q = "", islem = "tum", tarih = "tum", s } = await searchParams;
  const arama = q.trim().slice(0, 80);
  const sayfa = Math.max(1, Number.parseInt(s ?? "1", 10) || 1);
  const islemGecerli = islem in EYLEM_ETIKETI ? islem : "tum";
  const altSinir = tarihAltSiniri(tarih);

  const where = {
    ...(islemGecerli !== "tum" ? { action: islemGecerli } : {}),
    ...(altSinir ? { createdAt: { gte: altSinir } } : {}),
    ...(arama
      ? {
          OR: [
            { entityLabel: { contains: arama, mode: "insensitive" as const } },
            { adminLabel: { contains: arama, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [kayitlar, filtreliToplam, tumToplam, son24] = await Promise.all([
    prisma.catalogAuditLog.findMany({ where, orderBy: { id: "desc" }, skip: (sayfa - 1) * SAYFA, take: SAYFA }),
    prisma.catalogAuditLog.count({ where }),
    prisma.catalogAuditLog.count(),
    prisma.catalogAuditLog.count({ where: { createdAt: { gte: tarihAltSiniri("24s") ?? undefined } } }),
  ]);

  const sayfaSayisi = Math.max(1, Math.ceil(filtreliToplam / SAYFA));
  const link = (p: number) =>
    `/admin/katalog/denetim?q=${encodeURIComponent(arama)}&islem=${islemGecerli}&tarih=${tarih}&s=${p}`;
  const filtreAktif = arama !== "" || islemGecerli !== "tum" || altSinir !== null;
  const baslangic = filtreliToplam === 0 ? 0 : (sayfa - 1) * SAYFA + 1;
  const bitis = Math.min(sayfa * SAYFA, filtreliToplam);

  return (
    <div className="px-4 sm:px-8 py-10 max-w-4xl">
      <AltMenu aktif="/admin/katalog/denetim" />

      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">Toplam işlem</p>
          <p className="text-2xl font-bold text-gray-900">{tumToplam.toLocaleString("tr-TR")}</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl px-4 py-3">
          <p className="text-xs text-gray-400">Son 24 saat</p>
          <p className="text-2xl font-bold text-gray-900">{son24.toLocaleString("tr-TR")}</p>
        </div>
      </div>

      <form className="grid grid-cols-2 sm:flex sm:flex-row gap-2 mb-4" action="/admin/katalog/denetim">
        <input
          name="q" defaultValue={arama} placeholder="Kayıt veya yönetici ara…"
          className="col-span-2 sm:col-span-1 sm:flex-1 min-w-0 border border-gray-200 rounded-lg px-3 py-2 text-sm"
        />
        <select name="islem" defaultValue={islemGecerli} className="col-span-2 sm:col-span-1 border border-gray-200 rounded-lg px-3 py-2 text-sm">
          <option value="tum">Tüm işlemler</option>
          {Object.entries(EYLEM_ETIKETI)
            .sort((a, b) => a[1].localeCompare(b[1], "tr"))
            .map(([anahtar, etiket]) => <option key={anahtar} value={anahtar}>{etiket}</option>)}
        </select>
        <select name="tarih" defaultValue={tarih} className="border border-gray-200 rounded-lg px-3 py-2 text-sm">
          {TARIH_SECENEKLERI.map((t) => <option key={t.deger} value={t.deger}>{t.etiket}</option>)}
        </select>
        <button className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-medium">Filtrele</button>
        {filtreAktif && (
          <Link href="/admin/katalog/denetim" className="col-span-2 sm:col-span-1 px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 text-center hover:bg-gray-50">
            Temizle
          </Link>
        )}
      </form>

      <p className="text-xs text-gray-400 mb-3">
        {filtreliToplam === 0 ? "Kayıt bulunamadı" : `${baslangic.toLocaleString("tr-TR")}–${bitis.toLocaleString("tr-TR")} / ${filtreliToplam.toLocaleString("tr-TR")} işlem`}
        {filtreAktif && " (filtreli)"}
      </p>

      <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
        <div className="hidden sm:grid grid-cols-[150px_1fr_170px] gap-4 px-4 py-2 bg-gray-50 border-b border-gray-100 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
          <span>Zaman</span><span>İşlem</span><span>Yönetici</span>
        </div>
        <ul className="divide-y divide-gray-100">
          {kayitlar.map((k) => (
            <li key={k.id} className="px-4 py-3 sm:grid sm:grid-cols-[150px_1fr_170px] sm:gap-4 sm:items-center">
              <p className="text-xs text-gray-400 whitespace-nowrap mb-1 sm:mb-0">{kisaZaman(k.createdAt)}</p>
              <div className="min-w-0">
                <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full border ${ROZET_SINIFI[eylemRengi(k.action)]}`}>
                  {EYLEM_ETIKETI[k.action] ?? k.action}
                </span>
                <p className="text-sm text-gray-700 break-words mt-1">{k.entityLabel ?? `${k.entityType} #${k.entityId ?? "?"}`}</p>
              </div>
              <p className="text-xs text-gray-500 truncate mt-1 sm:mt-0" title={k.adminLabel ?? undefined}>{k.adminLabel ?? "?"}</p>
            </li>
          ))}
          {kayitlar.length === 0 && (
            <li className="px-4 py-10 text-sm text-gray-400 text-center">
              {filtreAktif ? "Bu filtreyle eşleşen kayıt yok." : "Henüz kayıt yok."}
            </li>
          )}
        </ul>
      </div>

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
