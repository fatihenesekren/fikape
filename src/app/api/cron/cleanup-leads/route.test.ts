import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  insuranceLead: { deleteMany: vi.fn() },
  saleLead: { deleteMany: vi.fn() },
  dataDeletionRequest: { findMany: vi.fn() },
  consentLog: { deleteMany: vi.fn() },
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
