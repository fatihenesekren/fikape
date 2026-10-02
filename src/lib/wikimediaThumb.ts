// Wikipedia/Wikidata özet API'si küçük resmi 330 px genişlikte döndürür; araç kartlarında/sayfalarında (özellikle mobil 2x
// ekranda) bulanık görünür. Wikimedia'nın izinli küçük resim genişliklerinden (…, 500, 960, 1280, 1920) birine büyütülür.
// Yalnız upload.wikimedia.org/…/thumb/… adresleri ve mevcut genişlikten BÜYÜK hedef için değişir; başka her şey aynen döner.
export function wikimediaGenislet(url: string | null | undefined, hedefPx = 960): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.hostname !== "upload.wikimedia.org" || !u.pathname.includes("/thumb/")) return url;
    const m = u.pathname.match(/\/(\d+)px-([^/]+)$/);
    if (!m || Number(m[1]) >= hedefPx) return url;
    u.pathname = u.pathname.replace(/\/\d+px-([^/]+)$/, `/${hedefPx}px-$1`);
    return u.toString();
  } catch {
    return url;
  }
}
