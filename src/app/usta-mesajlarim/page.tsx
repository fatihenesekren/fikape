import { redirect } from "next/navigation";

// Liste görünümü /mesajlar sayfasına taşındı (Takas Mesajlarım / Usta
// Mesajlarım sekmeleri — bkz. feature_usta_gorusleri_ilerleme). Eski
// bookmark/linkler kırılmasın diye buradan yönlendiriyoruz. Konuşma detayı
// (/usta-mesajlarim/[id]) yerinde kalıyor, değişmedi.
export default function UstaMesajlarimRedirect() {
  redirect("/mesajlar?tab=usta");
}
