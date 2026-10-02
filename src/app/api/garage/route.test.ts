import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({
  product: { findUnique: vi.fn() },
  userProduct: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn(), deleteMany: vi.fn() },
  favorite: { upsert: vi.fn(), deleteMany: vi.fn() },
  review: { updateMany: vi.fn() },
  messageReport: { findFirst: vi.fn() },
}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "7" } })) }));
vi.mock("@/lib/rateLimit", () => ({ checkRateLimit: vi.fn(async () => true) }));

import * as garage from "./route";
import * as favorites from "../favorites/route";

const istek = (method: string, body: unknown, raw?: string) =>
  new Request("http://x/api", { method, headers: { "content-type": "application/json" }, body: raw ?? JSON.stringify(body) }) as never;

const GECERSIZ = ["abc", -5, 1.5, 99999999999999, [], {}, true];

describe("garaj ve favori uç noktaları geçersiz productId'de 400 verir (500 değil)", () => {
  beforeEach(() => vi.clearAllMocks());

  it.each(GECERSIZ)("garage POST/DELETE/PATCH %j", async (productId) => {
    expect((await garage.POST(istek("POST", { productId }))).status).toBe(400);
    expect((await garage.DELETE(istek("DELETE", { productId }))).status).toBe(400);
    expect((await garage.PATCH(istek("PATCH", { productId, action: "reactivate" }))).status).toBe(400);
    expect(prismaMock.userProduct.create).not.toHaveBeenCalled();
    expect(prismaMock.userProduct.findUnique).not.toHaveBeenCalled();
  });

  it.each(GECERSIZ)("favorites POST/DELETE %j", async (productId) => {
    expect((await favorites.POST(istek("POST", { productId }))).status).toBe(400);
    expect((await favorites.DELETE(istek("DELETE", { productId }))).status).toBe(400);
    expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
  });

  it("bozuk JSON 400", async () => {
    expect((await garage.POST(istek("POST", null, "{bozuk"))).status).toBe(400);
    expect((await favorites.POST(istek("POST", null, "["))).status).toBe(400);
  });

  it("var olmayan ürün 404 (FK hatasıyla 500 olmaz)", async () => {
    prismaMock.product.findUnique.mockResolvedValue(null);
    expect((await garage.POST(istek("POST", { productId: 999999 }))).status).toBe(404);
    expect((await favorites.POST(istek("POST", { productId: 999999 }))).status).toBe(404);
    expect(prismaMock.userProduct.create).not.toHaveBeenCalled();
    expect(prismaMock.favorite.upsert).not.toHaveBeenCalled();
  });

  it("geçerli id: garaja ekler", async () => {
    prismaMock.product.findUnique.mockResolvedValue({ id: 12 });
    prismaMock.userProduct.findUnique.mockResolvedValue(null);
    prismaMock.userProduct.create.mockResolvedValue({ id: 5 });
    const r = await garage.POST(istek("POST", { productId: "12" }));
    expect(r.status).toBe(200);
    expect(prismaMock.userProduct.create).toHaveBeenCalledWith({ data: { userId: 7, productId: 12 } });
  });

  it("reactivate: kayıt yoksa 404", async () => {
    prismaMock.userProduct.findUnique.mockResolvedValue(null);
    expect((await garage.PATCH(istek("PATCH", { productId: 12, action: "reactivate" }))).status).toBe(404);
    expect(prismaMock.userProduct.update).not.toHaveBeenCalled();
  });
});
