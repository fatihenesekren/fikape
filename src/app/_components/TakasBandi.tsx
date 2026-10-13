import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isTradeListingEnabled } from "@/lib/features";
import { TakasBandiKart } from "./TakasBandiKart";

// Ana sayfa "Takas Pazarı" bandı — Usta Görüşü bandının (UstaBandi) hemen üstünde; page.tsx'te
// `!quizParam` koşuluyla sarılır (quiz modunda görünmez). Özellik kapalıyken hiç görünmez
// (tıklanınca çalışmayan bir akışa götürmesin).
//
// Hedef ziyaretçiye göre değişir: garajında aracı olan üye → Takas Panelim; misafir ve aracı olmayan
// üye → tanıtım/şart sayfası (panel, takasla ilgisi olmayan üyeyi zaten tanıtım sayfasına yönlendirir;
// "Panelim" diye başlayıp tanıtım sayfasına düşmesin). Misafir için sorgu yok; üye için tek hafif
// varlık sorgusu (UstaBandi'ndeki aktif usta kontrolüyle aynı ağırlıkta).
export async function TakasBandi() {
  if (!isTradeListingEnabled()) return null;

  const session = await auth();
  let panelli = false;
  if (session?.user?.id) {
    const arac = await prisma.userProduct
      .findFirst({ where: { userId: Number(session.user.id), ownershipStatus: "CURRENT" }, select: { id: true } })
      .catch(() => null);
    panelli = arac != null;
  }
  return <TakasBandiKart uye={panelli} href={panelli ? "/takas-panelim" : "/takas-pazari-nasil-calisir"} />;
}
