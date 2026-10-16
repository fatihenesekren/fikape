/** Bilinen arama motoru / önizleme / izleme / betik istemcileri: görüntülenme sayaçlarını (vitrin sıralamasına girer) şişirmesinler. */
const BOT_DESENI = /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|monitor|uptime|headless|lighthouse|pingdom|python-requests|curl\/|wget\/|go-http-client|axios|node-fetch|java\//i;

export function botIstegiMi(userAgent: string | null | undefined): boolean {
  if (!userAgent) return true; // User-Agent'sız istek tarayıcı değildir
  return BOT_DESENI.test(userAgent);
}
