import { describe, it, expect } from "vitest";
import { askiEsigi, uyariEsigi, pasifDurumu } from "./pasifHesap";

const SIMDI = new Date("2028-10-12T08:00:00Z");
const gunOnce = (g: number) => new Date(SIMDI.getTime() - g * 86_400_000);
const temel = { createdAt: new Date("2026-09-01T00:00:00Z"), lastActiveAt: null, inactiveWarnedAt: null, inactiveSuspendedAt: null, trustLevel: 1, isBanned: false };

describe("eşikler", () => {
  it("askı eşiği tam 24 ay önce", () => {
    expect(askiEsigi(SIMDI).toISOString()).toBe("2026-10-12T08:00:00.000Z");
  });
  it("uyarı eşiği askı eşiğinden 30 gün sonra", () => {
    expect(uyariEsigi(SIMDI).toISOString()).toBe("2026-11-11T08:00:00.000Z");
  });
});

describe("pasifDurumu", () => {
  it("yakın zamanda etkin hesap aktif", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: gunOnce(10) }, SIMDI)).toBe("aktif");
  });
  it("23 aydan eski etkinlik uyarı alır ama henüz askıya alınmaz", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: new Date("2026-11-01T00:00:00Z") }, SIMDI)).toBe("uyari");
  });
  it("24 ayı aşmış ama hiç uyarılmamış hesap askıya ALINMAZ (önce uyarı)", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: new Date("2026-01-01T00:00:00Z") }, SIMDI)).toBe("uyari");
  });
  it("24 ayı aşmış, uyarı 30 günden eski → askıya alınır", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: new Date("2026-01-01T00:00:00Z"), inactiveWarnedAt: gunOnce(31) }, SIMDI)).toBe("askiya");
  });
  it("uyarı 30 günden yeniyse bekler", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: new Date("2026-01-01T00:00:00Z"), inactiveWarnedAt: gunOnce(10) }, SIMDI)).toBe("uyari");
  });
  it("lastActiveAt boşsa kayıt tarihi esas alınır", () => {
    expect(pasifDurumu({ ...temel, createdAt: gunOnce(5) }, SIMDI)).toBe("aktif");
  });
  it("yönetici ve banlı hesaplara dokunulmaz", () => {
    const eski = { ...temel, lastActiveAt: new Date("2025-01-01T00:00:00Z"), inactiveWarnedAt: gunOnce(60) };
    expect(pasifDurumu({ ...eski, trustLevel: 5 }, SIMDI)).toBe("aktif");
    expect(pasifDurumu({ ...eski, isBanned: true }, SIMDI)).toBe("aktif");
  });
  it("zaten askıdaki hesap askıda kalır", () => {
    expect(pasifDurumu({ ...temel, lastActiveAt: gunOnce(1), inactiveSuspendedAt: gunOnce(3) }, SIMDI)).toBe("askiya");
  });
});
