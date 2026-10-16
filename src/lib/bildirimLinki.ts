/** Bildirim bağlantısı yalnızca site içi göreli yol olabilir ("/..." ; "//" ve "/\" protokol-göreli/dış adres sayılır). */
export function bildirimLinkiGuvenli(link: string | null | undefined): string {
  if (typeof link !== "string") return "/bildirimler";
  if (!link.startsWith("/") || link.startsWith("//") || link.startsWith("/\\") || /[\u0000-\u001f]/.test(link)) return "/bildirimler";
  return link;
}
