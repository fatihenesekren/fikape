import { prisma } from "@/lib/prisma";
import { KIRILIMLAR } from "@/lib/katalogOneri/kirilimlar";
import { AltMenu } from "../AltMenu";
import { AdayListesiClient, type AdayKarti } from "./AdayListesiClient";

export const metadata = { title: "Önerilenler — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

const SECIM = {
  id: true, ay: true, kirilim: true, marka: true, model: true, versiyon: true, yil: true, tarihNotu: true,
  kaynakUrl: true, kaynakAdi: true, kaynakKademe: true, kanit: true, skor: true, katalogdaVar: true,
  mevcutUrunId: true, durum: true, urunId: true,
} as const;

export default async function OnerilenlerPage() {
  const [bekleyen, karar] = await Promise.all([
    prisma.newVehicleCandidate.findMany({ where: { durum: "ONERILDI" }, select: SECIM, orderBy: [{ ay: "desc" }, { skor: "desc" }] }),
    prisma.newVehicleCandidate.findMany({ where: { durum: { not: "ONERILDI" } }, select: SECIM, orderBy: { kararTarihi: "desc" }, take: 30 }),
  ]);
  const kart = (r: (typeof bekleyen)[number]): AdayKarti => ({ ...r, kategori: KIRILIMLAR.find((k) => k.key === r.kirilim)?.kategori ?? "otomobil" });

  return (
    <div className="px-4 sm:px-8 py-10 max-w-4xl">
      <AltMenu aktif="/admin/katalog/onerilenler" />
      <p className="text-sm text-gray-600 mb-5">
        Her ayın ilk Pazartesi&apos;si Türkiye&apos;de satışa çıkan yeni araçlar otomatik aranır. Ekle: form bilgilerle dolu açılır, özellikleri
        siz tamamlarsınız. Taslak olarak ekleyince kayıt yayında olmaz.
      </p>
      <AdayListesiClient bekleyen={bekleyen.map(kart)} karar={karar.map(kart)} />
    </div>
  );
}
