/**
 * BMW gibi markalarda motor kodu çekişi zaten içeriyor olabilir (ör. "sDrive16d" —
 * parseTip.ts kaynak SDRIVE+kod'u bitişik yazdığında hem motorParts'a hem cekis'e
 * "sDrive" yazıyor, ikisi de geçerli/doğru ama ayrı alanlar). Motor metni çekiş
 * kelimesini zaten barındırıyorsa versiyon metnine tekrar eklenmez — aksi halde
 * "sDrive16d 1.5 sDrive" gibi tekrarlı bir versiyon metni oluşuyordu (bkz.
 * kullanıcı geri bildirimi, BMW X1 sDrive16d).
 */
export function cekisTekrarsizEkle(motor: string | null, cekis: string | null): string {
  if (!cekis) return motor ?? "";
  if (motor && motor.toLowerCase().includes(cekis.toLowerCase())) return motor;
  return [motor, cekis].filter(Boolean).join(" ");
}
