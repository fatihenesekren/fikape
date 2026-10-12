// Aylık aday üretimi: kırılım başına ara → çıkar → doğrula → katalogla karşılaştır → seç → kaydet.
// Kırılımlar paralel çalışır, biri çökerse diğerleri etkilenmez. Aynı ay yeniden çalışırsa mevcut satırlar
// (UNIQUE kirilim+anahtar) yeniden yazılmaz; aramalar da tekrarlanmaz (ay için satırı olan kırılım atlanır).
import { prisma } from "@/lib/prisma";
import katalogIndex from "@/data/katalogIndex.json";
import type { KatalogIndex } from "@/lib/katalog/tipler";
import { adAnahtar } from "@/lib/katalog/ek";
import { findExistingVehicles } from "@/lib/existingVehicle";
import { baseNameplate, stripModelGenRange } from "@/lib/modelDisplay";
import { kirilimAra } from "./arama";
import { adayCikar, adaylariBirlestir, type AdayHam } from "./cikarim";
import { KIRILIMLAR, sorguHazirla, type Kirilim } from "./kirilimlar";
import { etiketle, sec, type MevcutBilgi } from "./suzgec";

const INDEX = katalogIndex as unknown as Record<string, KatalogIndex["otomobil"] | undefined>;
const KIRILIM_ZAMAN_ASIMI_MS = 40_000;

/** Resmî (statik) katalogda marka+model var mı? Nesil aralığı/numarası ayrıntısına duyarsız. */
export function resmiKataloqdaVar(kategori: string, marka: string, model: string): boolean {
  const markalar = INDEX[kategori] ?? [];
  const mk = adAnahtar(marka);
  const kayit = markalar.find((m) => adAnahtar(m.marka) === mk);
  if (!kayit) return false;
  const hedefler = new Set([adAnahtar(model), adAnahtar(stripModelGenRange(model)), adAnahtar(baseNameplate(model))]);
  hedefler.delete("");
  return kayit.modeller.some((m) => {
    const adaylar = [adAnahtar(m), adAnahtar(stripModelGenRange(m)), adAnahtar(baseNameplate(m))];
    return adaylar.some((x) => x && hedefler.has(x));
  });
}

async function mevcutBilgi(k: Kirilim, a: AdayHam): Promise<MevcutBilgi> {
  const urunler = await findExistingVehicles(a.marka, a.model, k.kategori);
  if (urunler.length > 0) {
    const p = await prisma.product.findUnique({ where: { slug: urunler[0].slug }, select: { id: true } });
    return { var: true, urunId: p?.id ?? null };
  }
  return { var: resmiKataloqdaVar(k.kategori, a.marka, a.model), urunId: null };
}

export interface KirilimSonucu {
  kirilim: string;
  yeni: number;
  var: number;
  atlandi?: boolean;
  hata?: string;
}

async function kirilimUret(k: Kirilim, ay: string, buYil: number): Promise<KirilimSonucu> {
  const kayitlar = await prisma.newVehicleCandidate.findMany({ where: { kirilim: k.key }, select: { anahtar: true, ay: true } });
  // Bu ay için zaten üretilmiş: aramaları tekrarlama (Tavily kotası + Vercel CPU)
  if (kayitlar.some((r) => r.ay === ay)) return { kirilim: k.key, yeni: 0, var: 0, atlandi: true };

  const kaynaklar = await kirilimAra(sorguHazirla(k, ay));
  const ham = adaylariBirlestir(await adayCikar(k, kaynaklar));

  // Katalogla karşılaştırma önceden (async) yapılır, etiketleme saf kalır
  const harita = new Map<AdayHam, MevcutBilgi>();
  await Promise.all(ham.map(async (a) => { harita.set(a, await mevcutBilgi(k, a)); }));

  const secilen = sec(etiketle(ham, new Set(kayitlar.map((r) => r.anahtar)), (a) => harita.get(a) ?? { var: false, urunId: null }, buYil));
  if (secilen.length > 0) {
    await prisma.newVehicleCandidate.createMany({
      data: secilen.map((a) => ({
        ay, kirilim: k.key, anahtar: a.anahtar, marka: a.marka, model: a.model, versiyon: a.versiyon, yil: a.yil,
        tarihNotu: a.tarihNotu, kaynakUrl: a.kaynakUrl, kaynakAdi: a.kaynakAdi, kaynakKademe: a.kademe, kanit: a.kanit,
        skor: a.skor, katalogdaVar: a.katalogdaVar, mevcutUrunId: a.mevcutUrunId,
      })),
      skipDuplicates: true,
    });
  }
  // Aday çıkmayan kırılımda satır yazılmaz; rapor yeniden denenirse o kırılım yeniden aranır (kota için kabul edilebilir)
  return { kirilim: k.key, yeni: secilen.filter((a) => !a.katalogdaVar).length, var: secilen.filter((a) => a.katalogdaVar).length };
}

const zamanAsimi = <T,>(p: Promise<T>, ms: number): Promise<T> =>
  Promise.race([p, new Promise<T>((_, rej) => setTimeout(() => rej(new Error("zaman aşımı")), ms))]);

/** `ay`: 'YYYY-MM'. Hatalar kırılım bazında toplanır; fonksiyon asla fırlatmaz. */
export async function aylikOnerileriUret(ay: string, buYil = new Date().getUTCFullYear()): Promise<KirilimSonucu[]> {
  const sonuclar = await Promise.allSettled(KIRILIMLAR.map((k) => zamanAsimi(kirilimUret(k, ay, buYil), KIRILIM_ZAMAN_ASIMI_MS)));
  return sonuclar.map((s, i) =>
    s.status === "fulfilled"
      ? s.value
      : { kirilim: KIRILIMLAR[i].key, yeni: 0, var: 0, hata: s.reason instanceof Error ? s.reason.message : "bilinmeyen hata" },
  );
}
