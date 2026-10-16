import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const prismaMock = vi.hoisted(() => ({ catalogAuditLog: { findMany: vi.fn(), count: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/adminAuth", () => ({ adminSayfaKorumasi: vi.fn(async () => {}) }));

import DenetimPage from "./page";

const kayit = (id: number, action: string, label: string) => ({
  id, action, entityType: "PRODUCT", entityId: id, entityLabel: label, adminLabel: "Yönetici A", createdAt: new Date(2026, 9, 11, 18, 37),
});
const render = async (q: Record<string, string> = {}) => renderToStaticMarkup(await DenetimPage({ searchParams: Promise.resolve(q) }));

describe("denetim sayfası", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.catalogAuditLog.findMany.mockResolvedValue([kayit(2, "PRODUCT_CREATE", "Apec APS2 2024"), kayit(1, "USER_BAN", "Kullanıcı #5")]);
    prismaMock.catalogAuditLog.count.mockResolvedValue(2);
  });

  it("kayıtları rozetle ve zamanla listeler, özet kartlarını gösterir", async () => {
    const html = await render();
    expect(html).toContain("Araç eklendi");
    expect(html).toContain("Apec APS2 2024");
    expect(html).toContain("emerald"); // ekleme yeşil
    expect(html).toContain("text-red-700"); // ban kırmızı
    expect(html).toContain("Toplam işlem");
    expect(html).toContain("Son 24 saat");
    expect(html).toContain("1–2 / 2 işlem");
  });

  it("sayfa başına 25 kayıt ister ve filtreleri sorguya çevirir", async () => {
    await render({ islem: "USER_BAN", tarih: "7g", q: "ahmet", s: "3" });
    const arg = prismaMock.catalogAuditLog.findMany.mock.calls[0][0];
    expect(arg.take).toBe(25);
    expect(arg.skip).toBe(50);
    expect(arg.where.action).toBe("USER_BAN");
    expect(arg.where.createdAt.gte).toBeInstanceOf(Date);
    expect(arg.where.OR).toHaveLength(2);
  });

  it("geçersiz işlem ve tarih değeri yok sayılır (sorguya girmez)", async () => {
    await render({ islem: "x'; DROP TABLE", tarih: "evil" });
    const where = prismaMock.catalogAuditLog.findMany.mock.calls[0][0].where;
    expect(where.action).toBeUndefined();
    expect(where.createdAt).toBeUndefined();
  });

  it("sonuç yoksa filtreli/filtresiz uygun boş mesaj", async () => {
    prismaMock.catalogAuditLog.findMany.mockResolvedValue([]);
    prismaMock.catalogAuditLog.count.mockResolvedValue(0);
    expect(await render()).toContain("Henüz kayıt yok.");
    expect(await render({ q: "yok" })).toContain("Bu filtreyle eşleşen kayıt yok.");
  });

  it("birden fazla sayfa varsa sayfalama bağlantıları görünür", async () => {
    prismaMock.catalogAuditLog.count.mockResolvedValue(60);
    const html = await render({ s: "2" });
    expect(html).toContain("← Önceki");
    expect(html).toContain("Sonraki →");
    expect(html).toContain("2 / 3");
  });
});
