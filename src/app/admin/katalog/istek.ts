// Admin katalog ekranları için ortak istemci yardımcıları
export interface ApiSonuc<T = Record<string, unknown>> {
  ok: boolean;
  status: number;
  veri: T & { error?: string; benzerler?: string[]; bag?: Record<string, number>; mevcut?: { slug?: string; name?: string } };
}

export async function apiIstek<T = Record<string, unknown>>(url: string, method: string, govde?: unknown): Promise<ApiSonuc<T>> {
  try {
    const r = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: govde === undefined ? undefined : JSON.stringify(govde),
    });
    const veri = await r.json().catch(() => ({}));
    return { ok: r.ok, status: r.status, veri };
  } catch {
    return { ok: false, status: 0, veri: { error: "Bağlantı hatası. Lütfen tekrar deneyin." } as ApiSonuc<T>["veri"] };
  }
}

export const KATEGORI_ETIKETI: Record<string, string> = {
  otomobil: "Otomobil", motosiklet: "Motosiklet", "e-scooter": "E-Scooter",
  "e-bisiklet": "E-Bisiklet", karavan: "Karavan", kamyonet: "Kamyonet",
};
export const YAKIT_ETIKETI: Record<string, string> = {
  GASOLINE: "Benzin", DIESEL: "Dizel", EV: "Elektrik", PHEV: "Plug-in Hibrit", HYBRID: "Hibrit", LPG: "LPG",
};
export const GECIKME_NOTU = "Değişiklik formlarda ve listelerde 1–3 dakika içinde görünür (önbellek).";
