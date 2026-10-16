import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

const prismaMock = vi.hoisted(() => ({ product: { findMany: vi.fn(), count: vi.fn(), groupBy: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/adminAuth", () => ({ adminSayfaKorumasi: vi.fn(async () => {}) }));

import KatalogListePage from "./page";

const render = async (q: Record<string, string> = {}) => renderToStaticMarkup(await KatalogListePage({ searchParams: Promise.resolve(q) }));

describe("katalog yönetimi listesi: durum sayıları", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.product.findMany.mockResolvedValue([]);
    prismaMock.product.count.mockResolvedValue(0);
    prismaMock.product.groupBy.mockResolvedValue([
      { status: "ACTIVE", isActive: true, _count: { _all: 376 } },
      { status: "ACTIVE", isActive: false, _count: { _all: 2 } },
      { status: "PENDING", isActive: false, _count: { _all: 2 } },
      { status: "REJECTED", isActive: false, _count: { _all: 1 } },
    ]);
  });

  it("Tümü, durum sayılarının toplamıdır (376 + 2 + 2 + 1 = 381) ve her durum ayrı görünür", async () => {
    const html = await render();
    expect(html).toContain("Tümü <span");
    expect(html).toMatch(/Tümü <span[^>]*>381</);
    expect(html).toMatch(/Yayında <span[^>]*>376</);
    expect(html).toMatch(/Pasif <span[^>]*>2</);
    expect(html).toMatch(/Bekleyen <span[^>]*>2</);
    expect(html).toMatch(/Reddedilen <span[^>]*>1</);
  });

  it("pasif ve bekleyen PENDING+isActive:false kayıtlar tek bir kovaya girer (çift sayım yok)", async () => {
    prismaMock.product.groupBy.mockResolvedValue([
      { status: "ACTIVE", isActive: true, _count: { _all: 10 } },
      { status: "PENDING", isActive: false, _count: { _all: 3 } },
      { status: "PENDING", isActive: true, _count: { _all: 1 } },
    ]);
    const html = await render();
    expect(html).toMatch(/Tümü <span[^>]*>14</);
    expect(html).toMatch(/Bekleyen <span[^>]*>4</);
    expect(html).toMatch(/Pasif <span[^>]*>0</);
  });

  it("Reddedilen filtresi status=REJECTED sorgusuna çevrilir", async () => {
    await render({ durum: "reddedilen" });
    expect(prismaMock.product.findMany.mock.calls[0][0].where.status).toBe("REJECTED");
  });

  it("durum etiketlerinin bağlantıları arama metnini korur", async () => {
    const html = await render({ q: "golf" });
    expect(html).toContain("durum=reddedilen");
    expect(html).toContain("q=golf");
  });
});
