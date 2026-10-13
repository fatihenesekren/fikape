import Link from "next/link";
import type { Metadata } from "next";
import { isTradeListingEnabled } from "@/lib/features";
import { takasPanelKapisi } from "@/lib/takasPanelKapisi";
import { takasIlanFormVerisi } from "@/lib/takasIlanVerisi";
import { AracIlanKarti } from "../_components/AracIlanKarti";

export const metadata: Metadata = { title: "İlanlarım · Takas Panelim", robots: { index: false } };

// Takas Panelim > İlanlarım: her araç için ilan açma, düzenleme, yenileme, kapatma ve yeniden açma. İlan formu büyük
// olduğundan ana panelde değil burada (ana panel Usta Panelim kadar sade kalsın). Kart, Garajım'daki kartın aynısıdır.
export default async function IlanlarimPage() {
  const kapi = await takasPanelKapisi("/takas-panelim/ilanlarim", "ilanlar");
  const geri = (
    <Link href="/takas-panelim" className="inline-flex items-center min-h-9 text-sm font-semibold text-gray-600 hover:text-gray-900">
      <span aria-hidden="true">←&nbsp;</span>Takas Panelim
    </Link>
  );

  if (kapi.hata) {
    return (
      <div className="max-w-3xl w-full mx-auto px-4 py-10">
        {geri}
        <h1 className="mt-2 text-2xl font-black text-gray-900">İlanlarım</h1>
        <p className="mt-4 text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5" role="alert">
          İlanlarınız şu anda yüklenemedi. Lütfen sayfayı yenileyin; sorun sürerse biraz sonra tekrar deneyin.
        </p>
      </div>
    );
  }

  const acik = isTradeListingEnabled();
  const { araclar, userId } = kapi;
  // Kategori/marka/ilan verisi yalnızca gerçekten ilan kartı çizilecekse yüklenir.
  const kartVerisi = acik && araclar.some((a) => a.aktifIlanId != null || a.uygunluk.uygun) ? await takasIlanFormVerisi(userId) : null;

  return (
    <div className="max-w-3xl w-full mx-auto px-4 py-10 space-y-6">
      <div>
        {geri}
        <h1 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-gray-900">İlanlarım</h1>
        <p className="mt-1.5 text-sm text-gray-600 leading-relaxed">
          Her araç için ilanınızı açabilir, düzenleyebilir, yenileyebilir veya kapatabilirsiniz.{" "}
          <Link href="/takas-pazari-nasil-calisir" className="font-semibold text-link hover:underline">
            Takas nasıl çalışır?
          </Link>
        </p>
      </div>

      {!acik ? (
        <p className="text-sm text-gray-700 bg-gray-50 border border-gray-100 rounded-2xl p-5">
          Takas Pazarı şu anda geçici olarak kullanılamıyor. Özellik yeniden açıldığında ilanlarınızı buradan yönetmeye devam edebilirsiniz.
        </p>
      ) : (
        <div className="space-y-4">
          {araclar.map((a) => (
            <AracIlanKarti key={a.userProductId} arac={a} kartVerisi={kartVerisi} takasAcik={acik} />
          ))}
        </div>
      )}
    </div>
  );
}
