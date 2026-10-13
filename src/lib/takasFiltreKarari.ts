// /takas sayfasının filtre durumuyla ilgili saf kararlar (sunucu sayfası ve kayıtlı arama kartı aynı kuralı kullansın;
// önceden "filtre var mı" üç yerde elle kopyalanmıştı ve ayrışabiliyordu).

/** Sonuçları daraltan gerçek adres parametreleri (sayfa numarası ve izleme parametreleri hariç). */
export const TAKAS_FILTRE_ANAHTARLARI = [
  "il", "kategori", "marka", "odeme", "yilMin", "yilMax", "kmMin", "kmMax", "yakit", "vites", "q",
] as const;

type HamParametreler = { [k: string]: string | string[] | undefined } | object;

function deger(v: unknown): string {
  const s = Array.isArray(v) ? v[0] : v;
  return typeof s === "string" ? s.trim() : "";
}

export function takasFiltreVarMi(params: HamParametreler): boolean {
  return TAKAS_FILTRE_ANAHTARLARI.some((k) => deger((params as Record<string, unknown>)[k]) !== "");
}

/** Filtreli sayfalar ve 2. sayfadan sonrası dizine girmez; izleme parametreleri (utm_*, fbclid…) tek başına etkilemez. */
export function takasIndekslenebilirMi(params: HamParametreler): boolean {
  if (takasFiltreVarMi(params)) return false;
  const sayfa = parseInt(deger((params as Record<string, unknown>).sayfa), 10);
  return !(Number.isFinite(sayfa) && sayfa > 1);
}

export type PanelGorunumu = "yok" | "yalnizListe" | "kart";

/**
 * Kayıtlı arama kartı ne çizsin?
 * - kart: uygulanmış herhangi bir filtre (hızlı arama kelimesi dahil) varsa — çipler ve tek "Filtreleri temizle" burada;
 *   kayıt düğmesi yalnız kaydedilebilir bir filtre varsa çıkar (kelime kayda girmez).
 * - yalnizListe: filtre yok, ama giriş yapmış kullanıcının kayıtlı araması var.
 */
export function panelGorunumu(g: {
  isLoggedIn: boolean;
  kaydedilebilirFiltre: boolean;
  q: string;
  kayitliSayisi: number;
}): PanelGorunumu {
  if (g.kaydedilebilirFiltre || g.q.trim() !== "") return "kart";
  if (g.isLoggedIn && g.kayitliSayisi > 0) return "yalnizListe";
  return "yok";
}

/** Filtreye uyan ilan yokken gösterilen kısa metin. Kayıt durumu ve "Filtreleri temizle" kartta; burada tekrarlanmaz. */
export function bosDurumMetni(g: { il: string }): { baslik: string; ipucu: string } {
  return {
    baslik: g.il ? `${g.il} ilinde bu filtrelere uyan ilan yok.` : "Bu filtrelere uyan ilan yok.",
    ipucu: "Bazı filtreleri kaldırarak yeniden deneyin.",
  };
}
