// "Ayın ilk Pazartesi'si" kapısı — hem üretim cron'u hem haftalık rapor aynı kuralı kullanır (UTC).

/** `now` ayın ilk Pazartesi'siyse 'YYYY-MM', değilse null. */
export function ilkPazartesiAyi(now: Date = new Date()): string | null {
  if (now.getUTCDay() !== 1 || now.getUTCDate() > 7) return null;
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`;
}

export const AY_BICIMI = /^\d{4}-(0[1-9]|1[0-2])$/;
