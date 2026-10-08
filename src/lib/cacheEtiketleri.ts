// Admin "Cache Temizle" düğmesinin geçersiz kıldığı önbellek etiketleri — tek kaynak.
// Yeni bir unstable_cache etiketi eklenirse buraya da eklenmeli, yoksa düğme onu temizlemez.
export const VITRIN_ETIKETI = "vitrin"; // getVitrin (lib/vitrin/getVitrin.ts)
export const KATALOG_EK_ETIKETI = "katalog-ek"; // EK_ETIKET ile aynı değer (lib/katalog/ekSunucu.ts)
export const VERI_CACHE_ETIKETI = "veri-cache"; // lib/dataCache.ts (karşılaştır/hero önerileri)
export const GORSEL_KAYNAK_ETIKETI = "gorsel-kaynaklari"; // /gorsel-kaynaklari listesi (görsel/atıf değişince ayrıca otomatik temizlenir)

export const CACHE_ETIKETLERI = [VITRIN_ETIKETI, KATALOG_EK_ETIKETI, VERI_CACHE_ETIKETI, GORSEL_KAYNAK_ETIKETI] as const;

/** Denetim kaydı ve yanıt için okunur kapsam adları. */
export const CACHE_KAPSAMI = ["sayfalar", "vitrin", "katalog", "veri"] as const;
