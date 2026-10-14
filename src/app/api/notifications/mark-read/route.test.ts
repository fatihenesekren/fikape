import { beforeEach, describe, expect, it, vi } from "vitest";

const prismaMock = vi.hoisted(() => ({ notification: { updateMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
const authMock = vi.hoisted(() => vi.fn());
vi.mock("@/auth", () => ({ auth: authMock }));

import { POST } from "./route";

const istek = (body?: unknown, raw?: string) =>
  new Request("http://x/api/notifications/mark-read", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: raw ?? (body === undefined ? undefined : JSON.stringify(body)),
  });

describe("POST /api/notifications/mark-read", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.mockResolvedValue({ user: { id: "7" } });
    prismaMock.notification.updateMany.mockResolvedValue({ count: 2 });
  });

  it("oturum yoksa 401", async () => {
    authMock.mockResolvedValue(null);
    expect((await POST(istek({ ids: [1] }))).status).toBe(401);
    expect(prismaMock.notification.updateMany).not.toHaveBeenCalled();
  });

  it("ids: yalnız çağıranın kendi okunmamış bildirimleri, tekilleştirilmiş", async () => {
    const res = await POST(istek({ ids: [3, 3, 5] }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, updated: 2 });
    expect(prismaMock.notification.updateMany).toHaveBeenCalledWith({
      where: { userId: 7, isRead: false, id: { in: [3, 5] } },
      data: { isRead: true },
    });
  });

  it("eski tekil biçim { id } çalışır", async () => {
    await POST(istek({ id: 9 }));
    expect(prismaMock.notification.updateMany.mock.calls[0][0].where).toEqual({ userId: 7, isRead: false, id: { in: [9] } });
  });

  it("gövde yok / boş nesne: tümü (yalnız kendi bildirimleri)", async () => {
    await POST(istek());
    await POST(istek({}));
    for (const c of prismaMock.notification.updateMany.mock.calls) {
      expect(c[0].where).toEqual({ userId: 7, isRead: false });
    }
  });

  it.each([
    [{ ids: [] }],
    [{ ids: "1" }],
    [{ ids: [0] }],
    [{ ids: [-1] }],
    [{ ids: [1.5] }],
    [{ ids: ["2"] }],
    [{ ids: Array.from({ length: 101 }, (_, i) => i + 1) }],
    [{ id: 0 }],
    [{ id: "3" }],
    [{ id: -4 }],
  ])("geçersiz girdi %j sessizce 'tümü'ne düşmez, 400 verir", async (govde) => {
    const res = await POST(istek(govde));
    expect(res.status).toBe(400);
    expect(prismaMock.notification.updateMany).not.toHaveBeenCalled();
  });
});
