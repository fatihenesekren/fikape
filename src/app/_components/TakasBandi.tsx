import { auth } from "@/auth";
import { isTradeListingEnabled } from "@/lib/features";
import { TakasBandiKart } from "./TakasBandiKart";

// Ana sayfa "Takas Pazarı" bandı — Usta Görüşü bandının (UstaBandi) hemen üstünde; page.tsx'te
// `!quizParam` koşuluyla sarılır (quiz modunda görünmez). Veritabanı sorgusu YOK: yalnızca oturuma bakar
// (ana sayfa zaten dinamik ve kök düzen oturumu okuyor), kişiye özel durum Takas Panelim'de gösterilir.
// Üye → Takas Panelim, misafir → tanıtım/şart sayfası. Özellik kapalıyken hiç görünmez
// (tıklanınca çalışmayan bir akışa götürmesin).
export async function TakasBandi() {
  if (!isTradeListingEnabled()) return null;
  const session = await auth();
  const uye = Boolean(session?.user?.id);
  return <TakasBandiKart uye={uye} href={uye ? "/takas-panelim" : "/takas-pazari-nasil-calisir"} />;
}
