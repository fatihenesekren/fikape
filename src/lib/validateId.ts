export const INT32_MAX = 2147483647;

/**
 * Pozitif int32 kimlik döndürür; geçersizse null. number VE katı sayısal string kabul eder.
 * ("12abc", "1e3", "012", " 12", 1.5, -5, 0, NaN, Infinity, 2147483648, [12], true… → null.)
 * Prisma Int alanlarına ham gövde/URL değeri vermeden önce kullanın; aksi halde tip/FK/taşma hataları 500 olur.
 */
export function pozitifTamsayiId(v: unknown): number | null {
  let n: number;
  if (typeof v === "number") n = v;
  else if (typeof v === "string" && /^[1-9]\d{0,9}$/.test(v)) n = Number(v);
  else return null;
  return Number.isInteger(n) && n >= 1 && n <= INT32_MAX ? n : null;
}
