import { beforeEach, describe, expect, it, vi } from "vitest";

// F-28: e-postasını doğrulamamış hesap takas ilanı açamaz, görüşme başlatamaz, mesaj gönderemez.
const prismaMock = vi.hoisted(() => ({ user: { findUnique: vi.fn() }, messageThread: { findUnique: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: prismaMock }));
vi.mock("@/auth", () => ({ auth: vi.fn(async () => ({ user: { id: "7" } })) }));
vi.mock("@/lib/features", () => ({ isTradeListingEnabled: () => true, isTradeMessagingEnabled: () => true }));

import { POST as ilanAc } from "./route";
import { POST as gorusmeBaslat } from "./[id]/threads/route";
import { POST as mesajGonder } from "./threads/[id]/messages/route";

const istek = () =>
  new Request("http://x", { method: "POST", headers: { "content-type": "application/json" }, body: "{}" });
const params = { params: Promise.resolve({ id: "1" }) };

const cagrilar: [string, () => Promise<Response>][] = [
  ["ilan oluşturma", () => ilanAc(istek())],
  ["görüşme başlatma", () => gorusmeBaslat(istek(), params)],
  ["mesaj gönderme", () => mesajGonder(istek(), params)],
];

describe("takas yazma uçları: e-posta doğrulaması", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    prismaMock.messageThread.findUnique.mockResolvedValue({
      id: 1, initiatorId: 7, blockedByUserId: null, closedByUserId: null, tradeListing: { userId: 9, isActive: true },
    });
  });

  it.each(cagrilar)("doğrulanmamış hesap reddedilir: %s", async (_ad, cagir) => {
    prismaMock.user.findUnique.mockResolvedValue({ isBanned: false, emailVerifiedAt: null, trustLevel: 5 });
    const res = await cagir();
    expect(res.status).toBe(403);
    expect((await res.json()).error).toMatch(/doğrulamanız/);
  });

  it.each(cagrilar)("doğrulanmış hesap bu kapıda durmaz: %s", async (_ad, cagir) => {
    prismaMock.user.findUnique.mockResolvedValue({ isBanned: false, emailVerifiedAt: new Date(), trustLevel: 5 });
    const res = await cagir().catch(() => null); // sonraki adımlar (mock'suz) hata verebilir; önemli olan doğrulama 403'ü olmaması
    if (res) {
      const govde = await res.clone().json().catch(() => ({}));
      expect(String(govde.error ?? "")).not.toMatch(/doğrulamanız/);
    }
  });
});
