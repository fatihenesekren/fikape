import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { daysAgo } from "@/lib/timeAgo";
import { BanUserButton } from "./BanUserButton";

export const metadata: Metadata = { title: "İçerik Filtresi — Admin" };
export const dynamic = "force-dynamic";

const WINDOW_DAYS = 30;
const REPEAT_THRESHOLD = 3;

const RULE_LABEL: Record<string, string> = {
  IBAN: "IBAN / banka hesabı",
  PHONE: "Telefon numarası",
  EMAIL: "E-posta adresi",
  CONTACT_HANDLE: "Sosyal medya hesabı",
  MESSAGING_APP: "Site dışı iletişim/link",
  URL: "Link",
  PROFANITY: "Hakaret",
  GIBBERISH: "Anlamsız metin",
};

const SURFACE_LABEL: Record<string, string> = {
  REVIEW: "Yorum",
  QNA: "Soru-Cevap",
  TRADE_MESSAGE: "Takas mesajı",
  TRADE_THREAD: "Takas ilk mesajı",
  TRADE_LISTING: "Takas ilanı",
  TRADE_RATING: "Takas değerlendirmesi",
  VEHICLE_SUGGEST: "Araç önerisi",
};

function fmt(d: Date | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleString("tr-TR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export default async function IcerikFiltresiPage() {
  const since = daysAgo(WINDOW_DAYS);

  const [total, byRule, bySurface, recent, repeatGroups] = await Promise.all([
    prisma.contentFilterHit.count({ where: { createdAt: { gte: since } } }),
    prisma.contentFilterHit.groupBy({
      by: ["rule"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.contentFilterHit.groupBy({
      by: ["surface"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
    }),
    prisma.contentFilterHit.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: "desc" },
      take: 40,
      include: { user: { select: { id: true, displayName: true, email: true, isBanned: true } } },
    }),
    prisma.contentFilterHit.groupBy({
      by: ["userId"],
      where: { createdAt: { gte: since } },
      _count: { id: true },
      _max: { createdAt: true },
      having: { id: { _count: { gte: REPEAT_THRESHOLD } } },
      orderBy: { _count: { id: "desc" } },
      take: 50,
    }),
  ]);

  const repeatUserIds = repeatGroups.map((g) => g.userId);
  const [repeatUsers, repeatHits] = await Promise.all([
    repeatUserIds.length
      ? prisma.user.findMany({
          where: { id: { in: repeatUserIds } },
          select: { id: true, displayName: true, email: true, isBanned: true, banReason: true },
        })
      : Promise.resolve([]),
    repeatUserIds.length
      ? prisma.contentFilterHit.findMany({
          where: { userId: { in: repeatUserIds }, createdAt: { gte: since } },
          select: { userId: true, rule: true, surface: true },
        })
      : Promise.resolve([]),
  ]);

  const userMap = new Map(repeatUsers.map((u) => [u.id, u]));
  const perUser = new Map<number, { rules: Set<string>; surfaces: Set<string> }>();
  for (const h of repeatHits) {
    const e = perUser.get(h.userId) ?? { rules: new Set(), surfaces: new Set() };
    e.rules.add(h.rule);
    e.surfaces.add(h.surface);
    perUser.set(h.userId, e);
  }

  const uniqueUsers = new Set([...recent.map((r) => r.userId), ...repeatUserIds]).size;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-xl font-bold text-gray-900">İçerik Filtresi</h1>
        <p className="text-sm text-gray-400 mt-1">
          IBAN / telefon / e-posta / link / sosyal medya paylaşımı engellenen gönderimler — son {WINDOW_DAYS} gün.
          Ham metin tutulmaz.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{total}</p>
          <p className="text-xs text-gray-400">Engellenen gönderim</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{uniqueUsers}</p>
          <p className="text-xs text-gray-400">Farklı kullanıcı</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">{repeatGroups.length}</p>
          <p className="text-xs text-gray-400">Tekrarlı ihlalci (≥{REPEAT_THRESHOLD})</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4 text-center">
          <p className="text-2xl font-black text-gray-900">
            {(byRule.find((r) => r.rule === "IBAN")?._count.id ?? 0) +
              (byRule.find((r) => r.rule === "PHONE")?._count.id ?? 0)}
          </p>
          <p className="text-xs text-gray-400">IBAN + telefon</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Kural dağılımı</h2>
          <div className="space-y-1.5">
            {byRule.sort((a, b) => b._count.id - a._count.id).map((r) => (
              <div key={r.rule} className="flex items-center justify-between text-sm bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-gray-700">{RULE_LABEL[r.rule] ?? r.rule}</span>
                <span className="font-bold text-gray-900">{r._count.id}</span>
              </div>
            ))}
            {byRule.length === 0 && <p className="text-sm text-gray-400">Kayıt yok.</p>}
          </div>
        </div>
        <div>
          <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Nerede</h2>
          <div className="space-y-1.5">
            {bySurface.sort((a, b) => b._count.id - a._count.id).map((s) => (
              <div key={s.surface} className="flex items-center justify-between text-sm bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-gray-700">{SURFACE_LABEL[s.surface] ?? s.surface}</span>
                <span className="font-bold text-gray-900">{s._count.id}</span>
              </div>
            ))}
            {bySurface.length === 0 && <p className="text-sm text-gray-400">Kayıt yok.</p>}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">
          Tekrarlı ihlalciler (son {WINDOW_DAYS} günde ≥{REPEAT_THRESHOLD} engellenen gönderim)
        </h2>
        {repeatGroups.length === 0 ? (
          <p className="text-sm text-gray-400">Tekrarlı ihlalci yok.</p>
        ) : (
          <div className="space-y-2">
            {repeatGroups.map((g) => {
              const u = userMap.get(g.userId);
              const agg = perUser.get(g.userId);
              return (
                <div key={g.userId} className="bg-white border border-gray-100 rounded-xl p-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800">
                      {u?.displayName ?? u?.email ?? `#${g.userId}`}
                      {u?.isBanned && (
                        <span className="ml-2 text-[10px] font-bold uppercase tracking-wide text-red-600 bg-red-50 rounded px-1.5 py-0.5">
                          Banlı
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      <span className="font-bold text-gray-800">{g._count.id}</span> deneme · son {fmt(g._max.createdAt)}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {[...(agg?.rules ?? [])].map((r) => RULE_LABEL[r] ?? r).join(", ")}
                      {" — "}
                      {[...(agg?.surfaces ?? [])].map((s) => SURFACE_LABEL[s] ?? s).join(", ")}
                    </p>
                  </div>
                  {!u?.isBanned && (
                    <BanUserButton userId={g.userId} count={g._count.id} />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-3">Son engellenen gönderimler</h2>
        {recent.length === 0 ? (
          <p className="text-sm text-gray-400">Kayıt yok.</p>
        ) : (
          <div className="space-y-1.5">
            {recent.map((h) => (
              <div key={h.id} className="flex items-center justify-between gap-3 text-sm bg-white border border-gray-100 rounded-lg px-3 py-2">
                <span className="text-gray-700 truncate">
                  {h.user.displayName ?? h.user.email ?? `#${h.userId}`}
                  {h.user.isBanned && <span className="ml-1.5 text-[10px] text-red-500">(banlı)</span>}
                </span>
                <span className="shrink-0 text-xs text-gray-500">
                  {RULE_LABEL[h.rule] ?? h.rule} · {SURFACE_LABEL[h.surface] ?? h.surface}
                </span>
                <span className="shrink-0 text-xs text-gray-400">{fmt(h.createdAt)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
