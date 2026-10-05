// Araç kartlarındaki vites etiketi — Product.attributes.transmission değerini
// ("Manuel", "manuel", "Otomatik", "CVT", "Yarı Otomatik" …) tek biçime çevirir.
// Bilinmeyen/boş değer null döner (kartta etiket gösterilmez).
const ETIKETLER: Record<string, string> = {
  manuel: "Manuel",
  otomatik: "Otomatik",
  cvt: "CVT",
  "yari otomatik": "Yarı Otomatik",
};

function sadelestir(s: string): string {
  return s
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i").replace(/ü/g, "u").replace(/ş/g, "s")
    .replace(/ö/g, "o").replace(/ç/g, "c").replace(/ğ/g, "g")
    .trim();
}

export function vitesEtiketi(raw: unknown): string | null {
  if (raw === null || raw === undefined || raw === "") return null;
  return ETIKETLER[sadelestir(String(raw))] ?? null;
}
