import { hhmm, sameDay } from "@/lib/messageTime";

// "Son temizleme" satırı için: bugün → "bugün 14:32", dün → "dün 14:32",
// aynı yıl → "12 Eki 14:32", farklı yıl → "12 Eki 2025 14:32". İstemcide (tarayıcı saat dilimi) çağrılır.
export function temizlemeZamaniEtiketi(d: Date, now: Date = new Date()): string {
  if (sameDay(d, now)) return `bugün ${hhmm(d)}`;
  const dun = new Date(now);
  dun.setDate(now.getDate() - 1);
  if (sameDay(d, dun)) return `dün ${hhmm(d)}`;
  const gun = d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "short",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
  return `${gun} ${hhmm(d)}`;
}
