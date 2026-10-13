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
