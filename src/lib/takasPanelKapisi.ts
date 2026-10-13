import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { takasUygunlukToplu, aracOnceligi, type TakasAracUygunlugu } from "@/lib/takasUygunluk";

// Takas Panelim ve alt sayfaları (İlanlarım, Aramalarım) için ortak erişim kapısı. Oturum yoksa girişe (aynı adrese
// dönmek üzere) yönlendirir; takasla ilgisi olmayan üyeyi tanıtım sayfasına gönderir. Kapı üç sayfada kopya olmasın
// diye tek yerde:
//   "panel"     — ana panel: garajında aracı / ilanı / görüşmesi / kayıtlı araması olan üye girer.
//   "ilanlar"   — İlanlarım: garajında araç gerekir; araçsız ama panele hakkı olan üye ana panele döner.
//   "aramalar"  — Aramalarım: yalnız oturum yeter (aracı olmayan üye de kayıtlı arama kullanabilmeli; asıl kitle onlar).
// Not: redirect() bir istisna fırlatır; bu yüzden redirect çağrıları try/catch içinde DEĞİL.

export type PanelKapisi =
  | { hata: true; userId: number }
  | {
      hata: false;
      userId: number;
      araclar: TakasAracUygunlugu[]; // garajda olanlar, hedefe yakınlığa göre sıralı
      toplamIlan: number;
      konusmaVar: boolean;
      kayitliArama: number;
    };

export async function takasPanelKapisi(yol: string, mod: "panel" | "ilanlar" | "aramalar"): Promise<PanelKapisi> {
  const session = await auth();
  if (!session?.user?.id) redirect(`/giris?callbackUrl=${encodeURIComponent(yol)}`);
  const userId = Number(session.user.id);

  if (mod === "aramalar") {
    return { hata: false, userId, araclar: [], toplamIlan: 0, konusmaVar: false, kayitliArama: 0 };
  }

  const [harita, toplamIlan, konusma, kayitliArama] = await Promise.all([
    takasUygunlukToplu(userId).catch(() => null),
    prisma.tradeListing.count({ where: { userId } }).catch(() => null),
    prisma.messageThread
      .findFirst({ where: { OR: [{ initiatorId: userId }, { tradeListing: { userId } }] }, select: { id: true } })
      .catch(() => null),
    prisma.savedSearch.count({ where: { userId } }).catch(() => 0),
  ]);

  // Veri okunamadıysa kullanıcıyı sessizce tanıtım sayfasına atmak yerine hatayı gösteririz.
  if (harita === null || toplamIlan === null) return { hata: true, userId };

  const araclar = [...harita.values()]
    .filter((a) => a.uygunluk.durum !== "GARAJDA_DEGIL")
    .sort((x, y) => aracOnceligi(x) - aracOnceligi(y));
  const ilgili = araclar.length > 0 || toplamIlan > 0 || konusma != null || kayitliArama > 0;

  if (!ilgili) redirect("/takas-pazari-nasil-calisir");
  if (mod === "ilanlar" && araclar.length === 0) redirect("/takas-panelim");

  return { hata: false, userId, araclar, toplamIlan, konusmaVar: konusma != null, kayitliArama };
}
