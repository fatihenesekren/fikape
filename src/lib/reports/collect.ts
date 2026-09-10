import { prisma } from "@/lib/prisma";
import { delta, pointDelta, fmtInt, fmtPct, type Delta, type WeekWindow } from "./format";

// Haftalık admin raporu için veri toplama. KVKK: yalnızca AGREGAT — sayı, oran,
// ortalama, Δ. Hiçbir isim / e-posta / userId / telefon / serbest metin yok;
// kişiye bağlı her şey /admin linkiyle veriliyor (bkz. 5-ajan KVKK değerlendirmesi).

export type Cell = { t: string; align?: "r"; delta?: Delta };

export interface ReportSection {
  title: string;
  note?: string;
  head?: string[];
  rows: Cell[][];
  link?: { href: string; label: string };
  failed?: boolean;
}

export interface Kpi {
  label: string;
  value: number;
  prev: number;
  goodDir: "up" | "down" | "none";
  sub?: string;
}

export interface WeeklyReportData {
  isoWeek: string;
  rangeLabel: string;
  weekStartIso: string;
  weekEndIso: string;
  generatedAtIso: string;
  snapshotMissing: boolean;
  quietWeek: boolean;
  headline: Kpi[];
  actionLine: string;
  sections: ReportSection[];
  sectionErrors: string[];
}

const DAY = 86_400_000;

function tt(t: string): Cell { return { t }; }
function nn(n: number): Cell { return { t: fmtInt(n), align: "r" }; }
/** Değer hücresi + ayrı Δ hücresi (satıra `...dd(...)` ile yayılır). */
function dd(cur: number, prev: number, goodDir: "up" | "down" | "none" = "up"): Cell[] {
  return [
    { t: fmtInt(cur), align: "r" },
    { t: "", align: "r", delta: delta(cur, prev, goodDir) },
  ];
}
/** Oran hücresi (ör. "%71") + puan cinsinden Δ hücresi. */
function rd(cur: number, prev: number, goodDir: "up" | "down" | "none" = "up"): Cell[] {
  return [
    { t: fmtPct(cur), align: "r" },
    { t: "", align: "r", delta: pointDelta(cur, prev, goodDir) },
  ];
}
function ageDays(from: Date | null | undefined, now: Date): string {
  if (!from) return "—";
  return String(Math.max(0, Math.floor((now.getTime() - from.getTime()) / DAY)));
}

/** Bir bölüm çökerse tüm rapor değil, sadece o bölüm "veri alınamadı" olur. */
async function guard(
  title: string,
  errors: string[],
  fn: () => Promise<ReportSection | ReportSection[]>,
): Promise<ReportSection[]> {
  try {
    const r = await fn();
    return Array.isArray(r) ? r : [r];
  } catch (e) {
    errors.push(`${title}: ${String(e).slice(0, 200)}`);
    return [{ title, rows: [], note: "Bu bölümün verisi alınamadı.", failed: true }];
  }
}

export async function collectWeeklyReport(win: WeekWindow): Promise<WeeklyReportData> {
  const now = new Date();
  const W = { gte: win.weekStart, lt: win.weekEnd };
  const P = { gte: win.prevStart, lt: win.prevEnd };
  const errors: string[] = [];

  // ── Snapshot (trafik) — reset-weekly-views cron'u yazar; yoksa bölüm boş geçer
  const [thisSnap, prevSnap] = await Promise.all([
    prisma.weeklyViewSnapshot.aggregate({ where: { weekStart: win.weekStart }, _sum: { weeklyViews: true } }).catch(() => null),
    prisma.weeklyViewSnapshot.aggregate({ where: { weekStart: win.prevStart }, _sum: { weeklyViews: true } }).catch(() => null),
  ]);
  const snapshotMissing = !thisSnap || thisSnap._sum.weeklyViews == null;

  // ── HEADLINE (7 KPI) ──────────────────────────────────────────────
  const [
    newUsersW, newUsersP, verifiedW, verifiedP,
    pubReviewW, pubReviewP,
    garageW, garageP, favW, favP,
    listingW, listingP,
    recipW, recipP,
    leadInsW, leadInsP, leadSaleW, leadSaleP,
  ] = await Promise.all([
    prisma.user.count({ where: { createdAt: W } }),
    prisma.user.count({ where: { createdAt: P } }),
    prisma.user.count({ where: { emailVerifiedAt: W } }),
    prisma.user.count({ where: { emailVerifiedAt: P } }),
    prisma.review.count({ where: { status: "PUBLISHED", publishedAt: W } }),
    prisma.review.count({ where: { status: "PUBLISHED", publishedAt: P } }),
    prisma.userProduct.count({ where: { createdAt: W } }),
    prisma.userProduct.count({ where: { createdAt: P } }),
    prisma.favorite.count({ where: { createdAt: W } }),
    prisma.favorite.count({ where: { createdAt: P } }),
    prisma.tradeListing.count({ where: { createdAt: W } }),
    prisma.tradeListing.count({ where: { createdAt: P } }),
    prisma.messageThread.count({ where: { createdAt: W, hasReciprocalReply: true } }),
    prisma.messageThread.count({ where: { createdAt: P, hasReciprocalReply: true } }),
    prisma.insuranceLead.count({ where: { createdAt: W } }),
    prisma.insuranceLead.count({ where: { createdAt: P } }),
    prisma.saleLead.count({ where: { createdAt: W } }),
    prisma.saleLead.count({ where: { createdAt: P } }),
  ]);

  const viewsW = thisSnap?._sum.weeklyViews ?? 0;
  const viewsP = prevSnap?._sum.weeklyViews ?? 0;

  const headline: Kpi[] = [
    { label: "Yeni üye", value: newUsersW, prev: newUsersP, goodDir: "up", sub: `${fmtInt(verifiedW)} doğrulanmış` },
    { label: "Yayınlanan yorum", value: pubReviewW, prev: pubReviewP, goodDir: "up" },
    { label: "Garaj + favori ekleme", value: garageW + favW, prev: garageP + favP, goodDir: "up" },
    { label: "Yeni takas ilanı", value: listingW, prev: listingP, goodDir: "up" },
    { label: "Karşılıklı mesajlaşan konu", value: recipW, prev: recipP, goodDir: "up" },
    { label: "Yeni lead", value: leadInsW + leadSaleW, prev: leadInsP + leadSaleP, goodDir: "up" },
    { label: "Haftalık araç görüntüleme", value: viewsW, prev: viewsP, goodDir: "up" },
  ];

  // ── AKSİYON SATIRI ────────────────────────────────────────────────
  const [
    pendReview, pendPhoto, pendSugg,
    oldestReview, oldestPhoto, oldestSugg,
    openDeletions, staleLeadIns, staleLeadSale,
  ] = await Promise.all([
    prisma.review.count({ where: { status: "PENDING" } }),
    prisma.productPhoto.count({ where: { status: "PENDING" } }),
    prisma.vehicleSuggestion.count({ where: { status: "PENDING" } }),
    prisma.review.aggregate({ where: { status: "PENDING" }, _min: { createdAt: true } }),
    prisma.productPhoto.aggregate({ where: { status: "PENDING" }, _min: { createdAt: true } }),
    prisma.vehicleSuggestion.aggregate({ where: { status: "PENDING" }, _min: { createdAt: true } }),
    prisma.dataDeletionRequest.count({ where: { status: { in: ["PENDING", "IN_PROGRESS"] } } }),
    prisma.insuranceLead.count({ where: { status: "NEW" } }),
    prisma.saleLead.count({ where: { status: "NEW" } }),
  ]);
  const oldestAny = [oldestReview._min.createdAt, oldestPhoto._min.createdAt, oldestSugg._min.createdAt]
    .filter(Boolean)
    .sort((a, b) => a!.getTime() - b!.getTime())[0];
  const actionLine =
    `Moderasyon: ${fmtInt(pendReview)} yorum + ${fmtInt(pendPhoto)} foto + ${fmtInt(pendSugg)} öneri` +
    ` · En eski ${ageDays(oldestAny, now)} gün` +
    ` · Silme talebi: ${fmtInt(openDeletions)}` +
    ` · Bekleyen lead: ${fmtInt(staleLeadIns + staleLeadSale)}`;

  // ── BÖLÜMLER ─────────────────────────────────────────────────────
  const sections: ReportSection[] = [];

  sections.push(...await guard("Büyüme", errors, async () => {
    const [refW, refP, banW, banP] = await Promise.all([
      prisma.user.count({ where: { createdAt: W, referredByUserId: { not: null } } }),
      prisma.user.count({ where: { createdAt: P, referredByUserId: { not: null } } }),
      prisma.user.count({ where: { bannedAt: W } }),
      prisma.user.count({ where: { bannedAt: P } }),
    ]);
    const vrW = newUsersW ? verifiedW / newUsersW : 0;
    const vrP = newUsersP ? verifiedP / newUsersP : 0;
    return {
      title: "Büyüme",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [tt("Yeni kayıt"), ...dd(newUsersW, newUsersP)],
        [tt("Doğrulanmış e-posta"), ...dd(verifiedW, verifiedP)],
        [tt("Doğrulama oranı"), ...rd(vrW, vrP)],
        [tt("Referanslı kayıt"), ...dd(refW, refP)],
        [tt("Banlanan hesap"), ...dd(banW, banP, "down")],
      ],
      link: { href: "/admin", label: "Admin" },
    };
  }));

  sections.push(...await guard("İçerik üretimi", errors, async () => {
    const [
      revCreatedW, revCreatedP, revRejW, revRejP,
      qW, qP, aW, aP,
      photoByStatus, firstReviewedW, firstReviewedP,
      unansweredQ,
    ] = await Promise.all([
      prisma.review.count({ where: { createdAt: W } }),
      prisma.review.count({ where: { createdAt: P } }),
      prisma.review.count({ where: { status: "REJECTED", rejectedAt: W } }),
      prisma.review.count({ where: { status: "REJECTED", rejectedAt: P } }),
      prisma.question.count({ where: { createdAt: W } }),
      prisma.question.count({ where: { createdAt: P } }),
      prisma.answer.count({ where: { createdAt: W } }),
      prisma.answer.count({ where: { createdAt: P } }),
      prisma.productPhoto.groupBy({ by: ["status"], where: { createdAt: W }, _count: { _all: true } }),
      prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM (
          SELECT "productId", MIN("publishedAt") AS first_pub
          FROM reviews WHERE status = 'PUBLISHED' GROUP BY "productId"
        ) t WHERE first_pub >= ${win.weekStart} AND first_pub < ${win.weekEnd}`,
      prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM (
          SELECT "productId", MIN("publishedAt") AS first_pub
          FROM reviews WHERE status = 'PUBLISHED' GROUP BY "productId"
        ) t WHERE first_pub >= ${win.prevStart} AND first_pub < ${win.prevEnd}`,
      prisma.question.count({ where: { answers: { none: {} } } }),
    ]);
    const photoW = photoByStatus.reduce((s, r) => s + r._count._all, 0);
    const pubRate = revCreatedW + revRejW ? pubReviewW / (pubReviewW + revRejW) : 0;
    return {
      title: "İçerik üretimi",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [tt("Yorum gönderildi"), ...dd(revCreatedW, revCreatedP)],
        [tt("Yorum yayınlandı"), ...dd(pubReviewW, pubReviewP)],
        [tt("Yorum reddedildi"), ...dd(revRejW, revRejP, "down")],
        [tt("Yayın oranı (bu hafta işlenen)"), { t: fmtPct(pubRate), align: "r" }],
        [tt("Yeni soru"), ...dd(qW, qP)],
        [tt("Yeni cevap"), ...dd(aW, aP)],
        [tt("Cevapsız soru (toplam)"), nn(unansweredQ)],
        [tt("Fotoğraf yüklendi"), nn(photoW)],
        [tt("İlk yorumunu alan araç"), ...dd(firstReviewedW[0]?.n ?? 0, firstReviewedP[0]?.n ?? 0)],
      ],
      link: { href: "/admin/yorumlar", label: "Yorumlar" },
    };
  }));

  sections.push(...await guard("Sıfır-sonuç aramalar", errors, async () => {
    const [totalW, zeroRows] = await Promise.all([
      prisma.searchQueryLog.count({ where: { createdAt: W } }),
      prisma.$queryRaw<{ term: string; hits: number; source: string }[]>`
        SELECT term, COUNT(*)::int AS hits, MAX(source) AS source
        FROM search_query_logs
        WHERE "resultCount" = 0 AND "createdAt" >= ${win.weekStart} AND "createdAt" < ${win.weekEnd}
        GROUP BY term
        ORDER BY hits DESC, term ASC
        LIMIT 20`,
    ]);
    const zeroTotal = zeroRows.reduce((s, r) => s + r.hits, 0);
    if (zeroRows.length === 0) {
      return {
        title: "Sıfır-sonuç aramalar (kataloğa aday)",
        rows: [],
        note: totalW === 0
          ? "Bu hafta arama logu yok (özellik yeni; veri birikiyor)."
          : `${fmtInt(totalW)} arama yapıldı, sonuçsuz arama yok.`,
      };
    }
    return {
      title: "Sıfır-sonuç aramalar (kataloğa aday)",
      note: `${fmtInt(zeroTotal)} sonuçsuz arama, ${fmtInt(zeroRows.length)}+ farklı terim — kataloğa eklenecek marka/model listesi.`,
      head: ["Arama terimi", "Kaç kez"],
      rows: zeroRows.map((r) => [tt(r.term), nn(r.hits)]),
      link: { href: "/oner", label: "Araç öner" },
    };
  }));

  sections.push(...await guard("Etkileşim", errors, async () => {
    const [
      gpCurW, gpCurP, gpPastW, gpPastP,
      soldW, soldP, ssW, ssP, notifW,
    ] = await Promise.all([
      prisma.userProduct.count({ where: { createdAt: W, ownershipStatus: "CURRENT" } }),
      prisma.userProduct.count({ where: { createdAt: P, ownershipStatus: "CURRENT" } }),
      prisma.userProduct.count({ where: { createdAt: W, ownershipStatus: "PAST" } }),
      prisma.userProduct.count({ where: { createdAt: P, ownershipStatus: "PAST" } }),
      prisma.userProduct.count({ where: { soldAt: W } }),
      prisma.userProduct.count({ where: { soldAt: P } }),
      prisma.savedSearch.count({ where: { createdAt: W } }),
      prisma.savedSearch.count({ where: { createdAt: P } }),
      prisma.notification.count({ where: { createdAt: W } }),
    ]);
    return {
      title: "Etkileşim",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [tt("Garaj ekleme (kullanıyor)"), ...dd(gpCurW, gpCurP)],
        [tt("Garaj ekleme (geçmiş araç)"), ...dd(gpPastW, gpPastP)],
        [tt("\"Sattım\" işaretlenen"), ...dd(soldW, soldP, "none")],
        [tt("Favori ekleme"), ...dd(favW, favP)],
        [tt("Kayıtlı arama"), ...dd(ssW, ssP)],
        [tt("Gönderilen bildirim (bağlam)"), nn(notifW)],
      ],
    };
  }));

  sections.push(...await guard("Takas pazarı sağlığı", errors, async () => {
    const [
      activeNow, closedByReason, threadW, threadP,
      tradedW, tradedP, ratingAgg, dupPairRows,
    ] = await Promise.all([
      prisma.tradeListing.count({ where: { isActive: true } }),
      prisma.tradeListing.groupBy({ by: ["closeReason"], where: { closedAt: W }, _count: { _all: true } }),
      prisma.messageThread.count({ where: { createdAt: W } }),
      prisma.messageThread.count({ where: { createdAt: P } }),
      prisma.tradeListing.count({ where: { closeReason: "TRADED", closedAt: W } }),
      prisma.tradeListing.count({ where: { closeReason: "TRADED", closedAt: P } }),
      prisma.tradeRating.aggregate({ where: { createdAt: W }, _avg: { score: true }, _count: { _all: true } }),
      // "Çift başına tek canlı görüşme" invariant'ının sağlık göstergesi: aynı
      // kullanıcı çiftinin, engellenmemiş + kapanmamış + ilanı aktif 2+ canlı
      // görüşmesi. Fix çalışıyorsa bu sayı BÜYÜMEMELİ (bkz. çift-thread fix §8).
      prisma.$queryRaw<{ n: number }[]>`
        SELECT COUNT(*)::int AS n FROM (
          SELECT 1
          FROM message_threads mt
          JOIN trade_listings tl ON tl.id = mt."tradeListingId"
          WHERE mt."blockedByUserId" IS NULL
            AND mt."closedByUserId"  IS NULL
            AND tl."isActive" = true
            AND mt."initiatorId" <> tl."userId"
          GROUP BY LEAST(mt."initiatorId", tl."userId"), GREATEST(mt."initiatorId", tl."userId")
          HAVING COUNT(*) >= 2
        ) d`,
    ]);
    const closedMap = new Map(closedByReason.map((r) => [r.closeReason ?? "—", r._count._all]));
    return {
      title: "Takas pazarı sağlığı",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [tt("Yeni ilan"), ...dd(listingW, listingP)],
        [tt("Aktif ilan (şu an)"), nn(activeNow)],
        [tt("Kapandı — takas oldu"), ...dd(tradedW, tradedP)],
        [tt("Kapandı — vazgeçildi/başka yerde"), nn((closedMap.get("GAVE_UP") ?? 0) + (closedMap.get("FOUND_ELSEWHERE") ?? 0))],
        [tt("Yeni mesaj konusu"), ...dd(threadW, threadP)],
        [tt("Karşılıklı mesajlaşan konu"), ...dd(recipW, recipP)],
        [tt("Yeni değerlendirme"), nn(ratingAgg._count._all)],
        [tt("Ortalama takas puanı"), { t: ratingAgg._avg.score ? ratingAgg._avg.score.toFixed(1).replace(".", ",") : "—", align: "r" }],
        [tt("Çift-thread duplikesi (büyümemeli)"), nn(dupPairRows[0]?.n ?? 0)],
      ],
      link: { href: "/admin/mesaj-raporlari", label: "Mesaj raporları" },
    };
  }));

  sections.push(...await guard("Moderasyon ve kötüye kullanım", errors, async () => {
    const trail4wStart = new Date(win.weekStart.getTime() - 28 * DAY);
    const trail30dStart = new Date(win.weekStart.getTime() - 30 * DAY);
    const [
      cfhByRule, cfhTrail4w, offenders, modActions, delReqW, delReqP,
    ] = await Promise.all([
      prisma.contentFilterHit.groupBy({ by: ["rule"], where: { createdAt: W }, _count: { _all: true } }),
      prisma.contentFilterHit.count({ where: { createdAt: { gte: trail4wStart, lt: win.weekStart } } }),
      prisma.contentFilterHit.groupBy({
        by: ["userId"],
        where: { createdAt: { gte: trail30dStart, lt: win.weekEnd } },
        _count: { _all: true },
        having: { userId: { _count: { gte: 3 } } },
      }),
      prisma.moderationLog.count({ where: { createdAt: W } }),
      prisma.dataDeletionRequest.count({ where: { requestedAt: W } }),
      prisma.dataDeletionRequest.count({ where: { requestedAt: P } }),
    ]);
    const cfhW = cfhByRule.reduce((s, r) => s + r._count._all, 0);
    const trail4wAvg = cfhTrail4w / 4;
    const spike = trail4wAvg > 0 && cfhW > trail4wAvg * 1.5;
    const ruleLabel: Record<string, string> = {
      IBAN: "IBAN", PHONE: "Telefon", EMAIL: "E-posta", CONTACT_HANDLE: "Sosyal medya",
      MESSAGING_APP: "Site dışı link", URL: "Link", PROFANITY: "Hakaret", GIBBERISH: "Anlamsız",
    };
    const rows: Cell[][] = [
      [tt("Bekleyen yorum moderasyonu"), nn(pendReview)],
      [tt("Bekleyen fotoğraf"), nn(pendPhoto)],
      [tt("Bekleyen araç önerisi"), nn(pendSugg)],
      [tt("En eski bekleyen öğe (gün)"), { t: ageDays(oldestAny, now), align: "r" }],
      [tt("İçerik filtresi engellemesi"), { t: fmtInt(cfhW), align: "r" }],
      [tt("Tekrarlı ihlalci (30g ≥3 deneme)"), { t: fmtInt(offenders.length), align: "r" }],
      [tt("Aldığın moderasyon aksiyonu"), nn(modActions)],
      [tt("Silme talebi (bu hafta)"), ...dd(delReqW, delReqP, "none")],
    ];
    for (const r of cfhByRule.sort((a, b) => b._count._all - a._count._all)) {
      rows.push([tt(`  ↳ ${ruleLabel[r.rule] ?? r.rule}`), nn(r._count._all)]);
    }
    return {
      title: "Moderasyon ve kötüye kullanım",
      note: spike ? "⚠️ İçerik filtresi bu hafta 4 haftalık ortalamanın 1,5 katından fazla — spam/kaçış dalgası olabilir." : undefined,
      head: ["Metrik", "Değer", "Δ"],
      rows,
      link: { href: "/admin/icerik-filtresi", label: "İçerik filtresi" },
    };
  }));

  sections.push(...await guard("Gelir sinyalleri", errors, async () => {
    const [
      insByStatus, saleByType, plusW, plusP, plusTotal,
    ] = await Promise.all([
      prisma.insuranceLead.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.saleLead.groupBy({ by: ["type"], where: { createdAt: W }, _count: { _all: true } }),
      prisma.plusWaitlistEntry.count({ where: { createdAt: W } }),
      prisma.plusWaitlistEntry.count({ where: { createdAt: P } }),
      prisma.plusWaitlistEntry.count(),
    ]);
    const insMap = new Map(insByStatus.map((r) => [r.status, r._count._all]));
    const saleMap = new Map(saleByType.map((r) => [r.type, r._count._all]));
    const plusNudge = plusTotal < 50 ? ` — 50'de Plus fiyatlandırmasını gözden geçir` : "";
    return {
      title: "Gelir sinyalleri",
      note: "Lead sayıları — isim/telefon e-postada yok, işlem için admin panelini aç.",
      head: ["Metrik", "Bu hafta", "Δ"],
      rows: [
        [tt("Sigorta talebi — yeni (7g)"), ...dd(leadInsW, leadInsP)],
        [tt("Sigorta talebi — bekleyen NEW"), nn(insMap.get("NEW") ?? 0)],
        [tt("Sigorta talebi — iletişim kuruldu"), nn(insMap.get("CONTACTED") ?? 0)],
        [tt("Sigorta talebi — tamamlandı"), nn(insMap.get("COMPLETED") ?? 0)],
        [tt("Ekspertiz talebi (7g)"), nn(saleMap.get("EXPERTISE") ?? 0)],
        [tt("Hızlı teklif talebi (7g)"), nn(saleMap.get("QUICK_OFFER") ?? 0)],
        [tt("Plus bekleme listesi (7g)"), ...dd(plusW, plusP)],
        [tt(`Plus bekleme listesi (toplam)${plusNudge}`), nn(plusTotal)],
      ],
      link: { href: "/admin/leads", label: "Gelir talepleri" },
    };
  }));

  sections.push(...await guard("En çok görüntülenen araçlar", errors, async () => {
    if (snapshotMissing) {
      return {
        title: "En çok görüntülenen araçlar",
        rows: [],
        note: "Görüntülenme anlık görüntüsü henüz yok (reset-weekly-views cron'u ilk pazartesi yazacak).",
        failed: true,
      };
    }
    const top = await prisma.weeklyViewSnapshot.findMany({
      where: { weekStart: win.weekStart },
      orderBy: { weeklyViews: "desc" },
      take: 10,
      include: { product: { select: { slug: true, brand: { select: { name: true } }, model: { select: { name: true } } } } },
    });
    const prevTop = await prisma.weeklyViewSnapshot.findMany({
      where: { weekStart: win.prevStart, productId: { in: top.map((t) => t.productId) } },
      select: { productId: true, weeklyViews: true },
    });
    const prevMap = new Map(prevTop.map((p) => [p.productId, p.weeklyViews]));
    return {
      title: "En çok görüntülenen araçlar",
      note: "Sadece araç sayfası sunucu isabetleri; bot/tekrar ayıklaması yok, diğer sayfalar dahil değil.",
      head: ["#", "Araç", "Görüntülenme", "Δ (önceki hafta)"],
      rows: top.map((t, i) => [
        { t: String(i + 1), align: "r" as const },
        tt(`${t.product.brand.name} ${t.product.model.name}`),
        ...dd(t.weeklyViews, prevMap.get(t.productId) ?? 0),
      ]),
      link: { href: "/admin", label: "Admin" },
    };
  }));

  sections.push(...await guard("Kullanım durumları (funnel)", errors, async () => {
    const cohortFrom = new Date(win.weekStart.getTime() - 90 * DAY);
    const [ownAgg, lifecycle, sugg] = await Promise.all([
      prisma.userProduct.groupBy({ by: ["ownershipStatus"], _count: { _all: true } }),
      prisma.$queryRaw<{ created: number; messaged: number; reciprocal: number; traded: number }[]>`
        WITH cohort AS (SELECT id FROM trade_listings WHERE "createdAt" >= ${cohortFrom})
        SELECT
          (SELECT COUNT(*)::int FROM cohort) AS created,
          (SELECT COUNT(DISTINCT mt."tradeListingId")::int
             FROM message_threads mt JOIN cohort c ON c.id = mt."tradeListingId") AS messaged,
          (SELECT COUNT(DISTINCT mt."tradeListingId")::int
             FROM message_threads mt JOIN cohort c ON c.id = mt."tradeListingId"
             WHERE mt."hasReciprocalReply") AS reciprocal,
          (SELECT COUNT(*)::int FROM trade_listings tl JOIN cohort c ON c.id = tl.id
             WHERE tl."closeReason" = 'TRADED') AS traded`,
      prisma.$queryRaw<{ suggested: number; approved: number; rejected: number }[]>`
        SELECT
          COUNT(*) FILTER (WHERE "createdAt" >= ${win.weekStart} AND "createdAt" < ${win.weekEnd})::int AS suggested,
          COUNT(*) FILTER (WHERE status = 'APPROVED' AND "reviewedAt" >= ${win.weekStart} AND "reviewedAt" < ${win.weekEnd})::int AS approved,
          COUNT(*) FILTER (WHERE status = 'REJECTED' AND "reviewedAt" >= ${win.weekStart} AND "reviewedAt" < ${win.weekEnd})::int AS rejected
        FROM vehicle_suggestions`,
    ]);
    const own = new Map(ownAgg.map((r) => [r.ownershipStatus, r._count._all]));
    const lc = lifecycle[0] ?? { created: 0, messaged: 0, reciprocal: 0, traded: 0 };
    const sg = sugg[0] ?? { suggested: 0, approved: 0, rejected: 0 };
    const pctOf = (a: number, b: number) => (b ? fmtPct(a / b) : "—");
    return [
      {
        title: "Kullanım durumları — garaj sahiplik",
        head: ["Durum", "Toplam kayıt"],
        rows: [
          [tt("Hâlâ kullanıyor (CURRENT)"), nn(own.get("CURRENT") ?? 0)],
          [tt("Geçmiş araç (PAST)"), nn(own.get("PAST") ?? 0)],
        ],
      },
      {
        title: "Kullanım durumları — ilan yaşam döngüsü (son 90 gün açılan)",
        note: "Bu kohortun rapor anındaki durumu; ileride takas olan ilan yeniden sayılmaz.",
        head: ["Aşama", "Adet", "Bir önceki aşamadan"],
        rows: [
          [tt("İlan açıldı"), nn(lc.created), tt("—")],
          [tt("≥1 mesaj aldı"), nn(lc.messaged), tt(pctOf(lc.messaged, lc.created))],
          [tt("Karşılıklı yazışma"), nn(lc.reciprocal), tt(pctOf(lc.reciprocal, lc.messaged))],
          [tt("Takas oldu"), nn(lc.traded), tt(pctOf(lc.traded, lc.reciprocal))],
        ],
      },
      {
        title: "Kullanım durumları — araç önerisi (bu hafta)",
        head: ["Aşama", "Adet"],
        rows: [
          [tt("Öneri gönderildi"), nn(sg.suggested)],
          [tt("Onaylandı (bu hafta işlenen)"), nn(sg.approved)],
          [tt("Reddedildi (bu hafta işlenen)"), nn(sg.rejected)],
        ],
        link: { href: "/admin/oneriler", label: "Araç önerileri" },
      },
    ];
  }));

  // ── Sessiz hafta tespiti (görüntülenme hariç akış KPI'larının hepsi 0) ──
  const quietWeek = headline
    .filter((k) => k.label !== "Haftalık araç görüntüleme")
    .every((k) => k.value === 0);

  return {
    isoWeek: win.isoWeek,
    rangeLabel: win.rangeLabel,
    weekStartIso: win.weekStart.toISOString(),
    weekEndIso: win.weekEnd.toISOString(),
    generatedAtIso: now.toISOString(),
    snapshotMissing,
    quietWeek,
    headline,
    actionLine,
    sections,
    sectionErrors: errors,
  };
}
