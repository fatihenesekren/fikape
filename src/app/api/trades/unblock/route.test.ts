import { beforeEach, describe, expect, it, vi } from "vitest";

const deleteMany = vi.fn();
const updateMany = vi.fn();
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "7" } })) }));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    blockedUser: { deleteMany: (...a: unknown[]) => deleteMany(...a) },
    messageThread: { updateMany: (...a: unknown[]) => updateMany(...a) },
    $transaction: vi.fn(async (ops: unknown[]) => Promise.all(ops)),
  },
}));

import { POST } from "./route";

const istek = (govde: unknown) => new Request("https://x.test/api/trades/unblock", { method: "POST", body: JSON.stringify(govde) });

describe("POST /api/trades/unblock", () => {
  beforeEach(() => { deleteMany.mockClear(); updateMany.mockClear(); });

  it("BlockedUser kaydını siler ve çiftin görüşmelerindeki engel işaretini kaldırır", async () => {
    const res = await POST(istek({ userId: 9 }));
    expect(res.status).toBe(200);
    expect(deleteMany).toHaveBeenCalledWith({ where: { blockerId: 7, blockedId: 9 } });
    const arg = updateMany.mock.calls[0][0];
    expect(arg.where.blockedByUserId).toBe(7);
    expect(arg.data).toEqual({ blockedByUserId: null, blockedAt: null });
    expect(JSON.stringify(arg.where.OR)).toContain('"initiatorId":9');
  });

  it("geçersiz kullanıcıda 400 döner ve hiçbir şeyi değiştirmez", async () => {
    const res = await POST(istek({ userId: "abc" }));
    expect(res.status).toBe(400);
    expect(deleteMany).not.toHaveBeenCalled();
  });
});
