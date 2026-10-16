import { beforeEach, describe, expect, it, vi } from "vitest";

const create = vi.fn();
const findUnique = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    user: { findUnique: (...a: unknown[]) => findUnique(...a) },
    catalogAuditLog: { create: (...a: unknown[]) => create(...a) },
  },
}));

import { adminEylemiKaydet } from "./adminEylemKaydi";

describe("adminEylemiKaydet", () => {
  beforeEach(() => { create.mockReset(); findUnique.mockReset(); });

  it("yönetici adıyla denetim satırı yazar", async () => {
    findUnique.mockResolvedValue({ displayName: "Admin Ali", email: "a@x.com" });
    await adminEylemiKaydet({ adminId: 3, action: "USER_BAN", entityType: "USER", entityId: 9, meta: { reason: "spam" } });
    const veri = create.mock.calls[0][0].data;
    expect(veri).toMatchObject({ adminId: 3, adminLabel: "Admin Ali", action: "USER_BAN", entityType: "USER", entityId: 9, meta: { reason: "spam" } });
  });

  it("yazma başarısız olursa asıl işlemi bozmaz (hata fırlatmaz)", async () => {
    findUnique.mockResolvedValue(null);
    create.mockRejectedValue(new Error("db down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    await expect(adminEylemiKaydet({ adminId: 3, action: "USER_UNBAN", entityType: "USER", entityId: 9 })).resolves.toBeUndefined();
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
