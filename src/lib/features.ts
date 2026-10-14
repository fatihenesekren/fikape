export function isTradeListingEnabled() {
  return process.env.TAKASA_AC_ILAN_ENABLED === "true";
}

export function isTradeMessagingEnabled() {
  return process.env.TAKASA_AC_MESAJ_ENABLED === "true";
}

// "Aracınızı artık takasa açabilirsiniz" bildirimi (lib/takasUygunlukBildirimi.ts). Varsayılan KAPALI:
// yanlış/yağan bildirim görülürse env'i kapatıp yeniden yayınlamak yeterli.
export function isTradeEligibleNotifyEnabled() {
  return process.env.TAKASA_AC_UYGUN_BILDIRIM_ENABLED === "true";
}

// Takas görüşmesinde karşılıklı telefon paylaşımı (lib/threadPhoneShare.ts). Varsayılan AÇIK (mesajlaşma bayrağına ek);
// sorun çıkarsa TAKASA_AC_TEL_PAYLASIM_ENABLED=false ile yalnız bu özellik kapatılır, mesajlaşma etkilenmez.
export function isPhoneShareEnabled() {
  return process.env.TAKASA_AC_TEL_PAYLASIM_ENABLED !== "false";
}
