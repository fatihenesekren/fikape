import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  insuranceLead: { deleteMany: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  saleLead: { deleteMany: vi.fn(), findMany: vi.fn(), update: vi.fn() },
  dataDeletionRequest: { findMany: vi.fn() },
  consentLog: { deleteMany: vi.fn() },
  plusWaitlistEntry: { deleteMany: vi.fn() },
  searchQueryLog: { deleteMany: vi.fn() },
  expertNoteTakedownRequest: { updateMany: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/cronAuth", () => ({ cronYetkili: vi.fn(() => true) }));
vi.mock("@/lib/sistemUyarisi", () => ({ cronHatasiBildir: vi.fn(async () => {}) }));

import { GET } from "./route";

const DAY = 24 * 60 * 60 * 1000;

describe("cleanup-leads: rıza kaydı temizliği (hesap silme tamamlandıktan 2 yıl sonra)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.insuranceLead.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.saleLead.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.plusWaitlistEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.searchQueryLog.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.expertNoteTakedownRequest.updateMany.mockResolvedValue({ count: 0 });
  });

  it("2 yıldan eski tamamlanmış silme talebi olan kullanıcıların rıza kayıtları silinir", async () => {
    prismaMock.dataDeletionRequest.findMany.mockResolvedValue([{ userId: 5 }, { userId: 9 }]);
    prismaMock.consentLog.deleteMany.mockResolvedValue({ count: 7 });

    const res = await GET(new Request("http://x/api/cron/cleanup-leads"));
    const govde = await res.json();

    expect(res.status).toBe(200);
    const sorgu = prismaMock.dataDeletionRequest.findMany.mock.calls[0][0].where;
    expect(sorgu.status).toBe("COMPLETED");
    const esik = (sorgu.completedAt.lt as Date).getTime();
    expect(Math.abs(Date.now() - 2 * 365 * DAY - esik)).toBeLessThan(60_000);
    expect(prismaMock.consentLog.deleteMany).toHaveBeenCalledWith({ where: { userId: { in: [5, 9] } } });
    expect(govde.deletedConsentLogs).toBe(7);
  });

  it("silinecek kullanıcı yoksa rıza kaydına dokunulmaz", async () => {
    prismaMock.dataDeletionRequest.findMany.mockResolvedValue([]);
    const govde = await (await GET(new Request("http://x/api/cron/cleanup-leads"))).json();
    expect(prismaMock.consentLog.deleteMany).not.toHaveBeenCalled();
    expect(govde.deletedConsentLogs).toBe(0);
  });
});

describe("cleanup-leads: bekleme listesi ve kaldırma talebi saklama süresi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.insuranceLead.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.saleLead.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.dataDeletionRequest.findMany.mockResolvedValue([]);
    prismaMock.plusWaitlistEntry.deleteMany.mockResolvedValue({ count: 4 });
    prismaMock.searchQueryLog.deleteMany.mockResolvedValue({ count: 9 });
    prismaMock.expertNoteTakedownRequest.updateMany.mockResolvedValue({ count: 2 });
  });

  it("2 yıldan eski bekleme listesi kayıtlarını siler, kapanmış kaldırma taleplerinin kişisel verisini anonimleştirir", async () => {
    const govde = await (await GET(new Request("http://x/api/cron/cleanup-leads"))).json();
    expect(govde).toMatchObject({ ok: true, deletedWaitlistEntries: 4, anonymizedTakedownRequests: 2 });
    const bekleme = prismaMock.plusWaitlistEntry.deleteMany.mock.calls[0][0].where.createdAt.lt as Date;
    expect(Date.now() - bekleme.getTime()).toBeGreaterThan(729 * DAY);
    const talep = prismaMock.expertNoteTakedownRequest.updateMany.mock.calls[0][0];
    expect(talep.where.appealStatus).toEqual({ not: "PENDING" });
    expect(talep.where.status.in).not.toContain("UNDER_REVIEW");
    expect(talep.data).toMatchObject({ claimantOrg: null, claimantPhone: null, claimantUserId: null });
  });
});

describe("cleanup-leads: eski düz telefonların şifrelenmesi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const m of [prismaMock.insuranceLead, prismaMock.saleLead]) m.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.plusWaitlistEntry.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.searchQueryLog.deleteMany.mockResolvedValue({ count: 0 });
    prismaMock.expertNoteTakedownRequest.updateMany.mockResolvedValue({ count: 0 });
    prismaMock.dataDeletionRequest.findMany.mockResolvedValue([]);
    process.env.PHONE_SHARE_KEY = "test-key";
  });

  it("LEAD_PHONE_ENCRYPTION=1 iken düz telefonlar l1: önekiyle güncellenir", async () => {
    process.env.LEAD_PHONE_ENCRYPTION = "1";
    prismaMock.insuranceLead.findMany.mockResolvedValue([{ id: 1, phone: "05067995520" }]);
    prismaMock.saleLead.findMany.mockResolvedValue([]);
    const body = await (await GET(new Request("http://x"))).json();
    expect(body.encryptedLeadPhones).toBe(1);
    expect(prismaMock.insuranceLead.update.mock.calls[0][0].data.phone).toMatch(/^l1:/);
    delete process.env.LEAD_PHONE_ENCRYPTION;
  });

  it("şifreleme kapalıyken hiçbir kayıt değiştirilmez", async () => {
    delete process.env.LEAD_PHONE_ENCRYPTION;
    const body = await (await GET(new Request("http://x"))).json();
    expect(body.encryptedLeadPhones).toBe(0);
    expect(prismaMock.insuranceLead.findMany).not.toHaveBeenCalled();
  });
});
