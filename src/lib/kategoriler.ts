// Katalog kategorileri — /araclar, /arama boş ekranı ve ana sayfa sekmeleri için TEK kaynak.
// Saf modül (import yok): sunucu ve istemci bileşenleri güvenle içe aktarır.
export const KATEGORILER = [
  { slug: "otomobil",   label: "Otomobil",   icon: "🚗" },
  { slug: "motosiklet", label: "Motosiklet", icon: "🏍️" },
  { slug: "e-scooter",  label: "E-Scooter",  icon: "⚡" },
  { slug: "e-bisiklet", label: "E-Bisiklet", icon: "🚴" },
  { slug: "karavan",    label: "Karavan",    icon: "🏕️" },
  { slug: "kamyonet",   label: "Kamyonet",   icon: "🛻" },
] as const;

export const KATEGORI_SLUGLARI: readonly string[] = KATEGORILER.map((k) => k.slug);

export const kategoriHref = (slug: string) => `/araclar?kategori=${encodeURIComponent(slug)}`;
