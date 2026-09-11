// Usta Görüşleri — topluluk iletişim teyidi. Kimlik/belge doğrulaması
// kaldırıldığı için (bkz. expertNote.ts EXPERT_BADGE notu) telefon/adresin
// gerçekliği hakkında fikape hiçbir beyanda bulunmaz; bunun yerine ustayla
// GERÇEKTEN iletişime geçmiş kullanıcıların topladığı "doğru muydu?" oyları
// bir eşiği geçince görünür olur. Metin BİLİNÇLİ olarak "doğrulandı" demez.
export const CONTACT_FEEDBACK_MIN_CONFIRMATIONS = 3;

export function contactFeedbackLabel(confirmedCount: number): string | null {
  if (confirmedCount < CONTACT_FEEDBACK_MIN_CONFIRMATIONS) return null;
  return `${confirmedCount} kullanıcı bu iletişim bilgisini teyit etti`;
}
