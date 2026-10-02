// Ürün yaşam döngüsü (tek tanım):
//  - PENDING  : kullanıcı önerisi, onay bekliyor (isActive=false). Öneren kullanıcı sayfada yorum/garaj/favori kullanabilir.
//  - ACTIVE + isActive=true  : yayında.
//  - ACTIVE + isActive=false : "PASİF" = admin tarafından katalogdan kaldırıldı. Sayfa açık kalır (mevcut yorum/garaj bağlantıları),
//                              yeni yorum/soru/garaj/favori kapalı, indekslenmez.
//  - REJECTED : reddedilmiş öneri (sayfa 404).
export interface UrunDurumu { status: string; isActive: boolean }

export const urunPasifMi = (p: UrunDurumu): boolean => p.status === "ACTIVE" && !p.isActive;
/** Yeni garaj/favori/yorum/soru kaydı kabul eder mi? */
export const yeniEtkilesimeAcikMi = (p: UrunDurumu): boolean => p.status !== "REJECTED" && !urunPasifMi(p);
