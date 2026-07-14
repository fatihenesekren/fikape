export function isTradeListingEnabled() {
  return process.env.TAKASA_AC_ILAN_ENABLED === "true";
}

export function isTradeMessagingEnabled() {
  return process.env.TAKASA_AC_MESAJ_ENABLED === "true";
}
