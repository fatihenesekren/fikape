// Ana sayfa (HeroSection) ve boş /arama ekranındaki "Popüler aramalar" çipleri — tek kaynak.
// Saf modül: hem sunucu hem istemci bileşenleri güvenle içe aktarır.
export const POPULAR_SEARCHES = [
  "Fiat Egea",
  "Tesla Model Y",
  "Ford Ranger",
  "Yamaha MT-07",
  "Togg T10X",
] as const;

/** Çip bağlantısı: `k=cip` arama kaydında "çip" kaynağı olarak ayrılır (organik arama istatistiğini şişirmez). */
export const populerAramaHref = (q: string) => `/arama?q=${encodeURIComponent(q)}&k=cip`;
