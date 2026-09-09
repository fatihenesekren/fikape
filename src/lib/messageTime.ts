// Mesajlaşma zaman etiketleri — hem sunucu (page.tsx) hem istemci
// (MessageThread) kullanır, bu yüzden ayrı ve saf.

export function sameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

// "14:32"
export function hhmm(d: Date): string {
  return d.toLocaleTimeString("tr-TR", { hour: "2-digit", minute: "2-digit" });
}

// Gün ayıracı: bugün → "Bugün", dün → "Dün", aynı yıl → "12 Eylül",
// farklı yıl → "12 Eylül 2025".
export function dayLabel(d: Date, now: Date = new Date()): string {
  if (sameDay(d, now)) return "Bugün";
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (sameDay(d, yesterday)) return "Dün";
  return d.toLocaleDateString("tr-TR", {
    day: "numeric",
    month: "long",
    ...(d.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
}
