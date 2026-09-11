// Usta başvurusu — pencere + kademeli kota (§5.2, docs/usta-gorusleri-plan.md).
//
// Tam tasarım: ayın ilk 7 günü başvuru penceresi + kademeli aylık kabul kotası
// K (ay 1-2: 3, ay 3-6: 5, ay 6+: koşullu +1/pencere, tavan 8) + backpressure
// (kuyruk/gecikmeye göre K yarılanır veya pencere atlanır).
//
// BİLİNÇLİ SADELEŞTİRME: "ay 1-2 / ay 3-6" kademesi bir "program başlangıç
// tarihi" referansı gerektiriyor ve bu henüz hiçbir yerde saklanmıyor (ilk
// usta başvurusunun ne zaman açıldığı bir config/DB alanı değil). Backpressure
// de kuyruk derinliği + medyan onay gecikmesi ölçümü ister — bunlar admin
// panelinde görünür ama otomatik kapı olarak henüz bağlı değil.
//
// Şimdilik: yalnızca AYIN İLK 7 GÜNÜ penceresi otomatik uygulanır (başvuru
// kabul/WAITLISTED ayrımı — bu dosyadaki isApplicationWindowOpen). Aylık kota
// ve backpressure, admin panelinde GÖRÜNÜR bir sayaç olarak sunulur
// (EXPERT_MONTHLY_QUOTA_DEFAULT), admin bu sayıya bakarak onaylar — otomatik
// hard-block DEĞİL. Tam algoritma (kademeli K + backpressure eşikleri),
// program başlangıcı ve kuyruk metrikleri gerçek veriyle görülünce eklenir.
export function isApplicationWindowOpen(date: Date = new Date()): boolean {
  return date.getDate() <= 7;
}

// Admin panelinde "bu ay X/K usta onaylandı" göstergesi için varsayılan.
// Gerçek kademe (3→5→8) ve backpressure (§5.2) devreye alınana kadar sabit.
export const EXPERT_MONTHLY_QUOTA_DEFAULT = 5;
