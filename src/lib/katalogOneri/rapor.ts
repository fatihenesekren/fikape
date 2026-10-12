// Haftalık rapor bölümü: kayıtlı adayları (new_vehicle_candidates) okur, ARAMA YAPMAZ — üretim ayrı cron'da.
// KVKK: yalnız araç bilgisi + kaynak bağlantısı; kişisel veri yok.
import { prisma } from "@/lib/prisma";
import type { ReportSection, Cell } from "@/lib/reports/collect";
import { KIRILIMLAR, ayParcala } from "./kirilimlar";

const tt = (t: string, href?: string): Cell => (href ? { t, href } : { t });

interface Satir {
  kirilim: string; marka: string; model: string; versiyon: string | null; yil: number | null;
  tarihNotu: string | null; kaynakUrl: string; kaynakAdi: string | null; kaynakKademe: string;
  skor: number; katalogdaVar: boolean;
}

/** Saf: satırları kırılım sırasına dizip tablo satırlarına çevirir (testli). */
export function oneriSatirlari(kayitlar: Satir[]): Cell[][] {
  const rows: Cell[][] = [];
  for (const k of KIRILIMLAR) {
    const hepsi = kayitlar.filter((r) => r.kirilim === k.key).sort((a, b) => b.skor - a.skor);
    const liste = [...hepsi.filter((r) => !r.katalogdaVar), ...hepsi.filter((r) => r.katalogdaVar)];
    if (liste.length === 0) {
      rows.push([tt(k.etiket), tt("— aday bulunamadı"), tt("")]);
      continue;
    }
    liste.forEach((r, i) => {
      const ad = [r.marka, r.model, r.versiyon, r.yil].filter(Boolean).join(" ");
      const ayrinti = [r.tarihNotu, r.katalogdaVar ? "KATALOGDA VAR" : null].filter(Boolean).join(" · ");
      rows.push([
        tt(i === 0 ? k.etiket : ""),
        tt(ayrinti ? `${ad} (${ayrinti})` : ad),
        tt(`${r.kaynakKademe} · ${r.kaynakAdi ?? "kaynak"}`, r.kaynakUrl),
      ]);
    });
  }
  return rows;
}

export async function oneriBolumu(ay: string): Promise<ReportSection> {
  const p = ayParcala(ay);
  const kayitlar = await prisma.newVehicleCandidate.findMany({
    where: { ay },
    select: {
      kirilim: true, marka: true, model: true, versiyon: true, yil: true, tarihNotu: true, kaynakUrl: true,
      kaynakAdi: true, kaynakKademe: true, skor: true, katalogdaVar: true,
    },
  });
  const bekleyen = await prisma.newVehicleCandidate.count({ where: { durum: "ONERILDI" } });
  return {
    title: `Kataloğa eklenecek yeni araçlar — ${p.ay} ${p.yil}`,
    note:
      "Otomatik aramayla bulundu; eklemeden önce kaynağı kontrol edin. A = resmî marka sayfası, B = haber yayını. " +
      `Karar bekleyen toplam aday: ${bekleyen}.` +
      (kayitlar.length === 0 ? " Bu ay için henüz aday üretilmemiş." : ""),
    head: ["Kırılım", "Araç", "Kaynak"],
    rows: kayitlar.length === 0 ? [] : oneriSatirlari(kayitlar),
    link: { href: "/admin/katalog/onerilenler", label: "Önerilenleri incele ve kataloğa ekle" },
  };
}
