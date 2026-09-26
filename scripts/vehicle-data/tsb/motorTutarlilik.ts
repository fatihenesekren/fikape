/**
 * TSB aynı motoru bazı satırlarda farklı kelime sırasıyla yazıyor (ör.
 * "1.8 HYBRID" vs "HYBRID 1.8", "V6 3.0 TDI" vs "3.0 TDI V6") — bu, aynı
 * motorun versiyon listesinde iki ayrı seçenekmiş gibi görünmesine yol açar
 * (bkz. kullanıcı geri bildirimi: Toyota Corolla "1.8 Hybrid" / "Hybrid 1.8").
 *
 * Aynı modelde, kelimeleri aynı (sırasız) olan farklı motor metinleri en sık
 * geçen yazıma sabitlenir (eşitlikte alfabetik). Yalnız kelime SIRASI farklı
 * olan metinler birleştirilir — farklı kelime kümesi olan motorlara (gerçekten
 * farklı motor olabilir) dokunulmaz.
 */
export function motorMetinleriniTutarliYap<T extends { motor: string | null }>(tipler: T[]): void {
  const imza = (motor: string) => motor.toLowerCase().split(/\s+/).sort().join(" ");

  const gruplar = new Map<string, Map<string, number>>();
  for (const t of tipler) {
    if (!t.motor) continue;
    const sayaclar = gruplar.get(imza(t.motor)) ?? new Map<string, number>();
    sayaclar.set(t.motor, (sayaclar.get(t.motor) ?? 0) + 1);
    gruplar.set(imza(t.motor), sayaclar);
  }

  const kanonik = new Map<string, string>();
  for (const [im, sayaclar] of gruplar) {
    if (sayaclar.size < 2) continue; // zaten tek yazım, dokunma
    const [en] = [...sayaclar.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    kanonik.set(im, en[0]);
  }

  for (const t of tipler) {
    if (!t.motor) continue;
    const hedef = kanonik.get(imza(t.motor));
    if (hedef && hedef !== t.motor) t.motor = hedef;
  }
}
