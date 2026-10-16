import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextResponse } from "next/server";

const prismaMock = vi.hoisted(() => ({ insuranceLead: { findUnique: vi.fn() }, saleLead: { findUnique: vi.fn() } }));
const adminIstekMock = vi.hoisted(() => vi.fn());
const kaydetMock = vi.hoisted(() => vi.fn<(g: Record<string, unknown>) => Promise<void>>(async () => {}));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/lib/adminIstek", () => ({ adminIstek: adminIstekMock }));
vi.mock("@/lib/adminEylemKaydi", () => ({ adminEylemiKaydet: kaydetMock }));

import { POST } from "./route";
import { leadTelefonuSifrele } from "@/lib/leadPhoneCrypto";

const istek = (govde: unknown) =>
  new Request("http://x/api/admin/leads/5/telefon", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(govde) });
const params = (id = "5") => ({ params: Promise.resolve({ id }) });

describe("admin lead telefonu gösterme", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.PHONE_SHARE_KEY = "test-key";
    adminIstekMock.mockResolvedValue({ admin: { userId: 9, label: "Admin" } });
  });

  it("yetkisiz istek reddedilir, kayıt okunmaz ve denetim kaydı yazılmaz", async () => {
    adminIstekMock.mockResolvedValue({ hata: NextResponse.json({ error: "Yetkisiz." }, { status: 403 }) });
    const res = await POST(istek({ kind: "insurance" }), params());
    expect(res.status).toBe(403);
    expect(prismaMock.insuranceLead.findUnique).not.toHaveBeenCalled();
    expect(kaydetMock).not.toHaveBeenCalled();
  });

  it("geçersiz tür ve kimlik 400 döner", async () => {
    expect((await POST(istek({ kind: "x" }), params())).status).toBe(400);
    expect((await POST(istek({ kind: "sale" }), params("abc"))).status).toBe(400);
    expect(kaydetMock).not.toHaveBeenCalled();
  });

  it("olmayan kayıt 404 döner ve denetim kaydı yazılmaz", async () => {
    prismaMock.saleLead.findUnique.mockResolvedValue(null);
    expect((await POST(istek({ kind: "sale" }), params())).status).toBe(404);
    expect(kaydetMock).not.toHaveBeenCalled();
  });

  it("şifreli telefonu çözüp döner, denetim kaydına yazar (numara kayda konmaz) ve önbelleğe almaz", async () => {
    prismaMock.insuranceLead.findUnique.mockResolvedValue({ phone: leadTelefonuSifrele("05551112233") });
    const res = await POST(istek({ kind: "insurance" }), params());
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ phone: "05551112233" });
    expect(res.headers.get("Cache-Control")).toBe("no-store");
    expect(kaydetMock).toHaveBeenCalledTimes(1);
    const kayit = kaydetMock.mock.calls[0][0];
    expect(kayit).toMatchObject({ adminId: 9, action: "LEAD_PHONE_REVEAL", entityType: "LEAD", entityId: 5 });
    expect(JSON.stringify(kayit)).not.toContain("05551112233");
  });

  it("eski düz metin kayıt da olduğu gibi döner", async () => {
    prismaMock.saleLead.findUnique.mockResolvedValue({ phone: "05067995520" });
    const res = await POST(istek({ kind: "sale" }), params());
    expect(await res.json()).toEqual({ phone: "05067995520" });
  });
});
