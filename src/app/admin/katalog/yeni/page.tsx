import { prisma } from "@/lib/prisma";
import { kirilimBul } from "@/lib/katalogOneri/kirilimlar";
import { AltMenu } from "../AltMenu";
import { YeniAracForm, type AdayBaslangic } from "./YeniAracForm";

export const metadata = { title: "Yeni Araç — Katalog Yönetimi" };
export const dynamic = "force-dynamic";

export default async function YeniAracPage({ searchParams }: { searchParams: Promise<{ aday?: string }> }) {
  const { aday: adayParam } = await searchParams;
  const adayId = /^\d{1,9}$/.test(adayParam ?? "") ? Number(adayParam) : null;

  // Aylık öneriden geliniyorsa form aday bilgisiyle dolu açılır (yalnız karar bekleyen aday)
  let baslangic: AdayBaslangic | null = null;
  if (adayId) {
    const a = await prisma.newVehicleCandidate.findFirst({ where: { id: adayId, durum: "ONERILDI" } });
    const k = a ? kirilimBul(a.kirilim) : undefined;
    if (a && k) {
      baslangic = {
        adayId: a.id, kirilim: k.key, kategori: k.kategori, yakit: k.yakit ?? "",
        marka: a.marka, model: a.model, versiyon: a.versiyon ?? "", yil: a.yil ? String(a.yil) : "",
        kaynakUrl: a.kaynakUrl, kaynakAdi: a.kaynakAdi, kanit: a.kanit, etiket: k.etiket,
      };
    }
  }

  return (
    <div className="px-4 sm:px-8 py-10 max-w-2xl">
      <AltMenu aktif="/admin/katalog/yeni" />
      <YeniAracForm baslangic={baslangic} />
    </div>
  );
}
