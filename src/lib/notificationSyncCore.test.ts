import { describe, expect, it } from "vitest";
import { applyNotificationsChange } from "./notificationSyncCore";

const n = (id: number, isRead: boolean) => ({ id, isRead, message: `m${id}` });
const durum = () => ({ unreadCount: 3, notifications: [n(1, false), n(2, false), n(3, true), n(4, false)] });

describe("applyNotificationsChange", () => {
  it("all: sayı 0, tüm listedekiler okundu", () => {
    const s = applyNotificationsChange(durum(), { all: true });
    expect(s.unreadCount).toBe(0);
    expect(s.notifications.every((x) => x.isRead)).toBe(true);
  });

  it("ids: yalnız listedeki okunmamışlar için sayı düşer, diğerlerine dokunmaz", () => {
    const s = applyNotificationsChange(durum(), { ids: [1, 3] }); // 3 zaten okunmuş → sayıyı düşürmez
    expect(s.unreadCount).toBe(2);
    expect(s.notifications.map((x) => x.isRead)).toEqual([true, false, true, false]);
  });

  it("listede olmayan id sayıyı değiştirmez (sunucu yenilemesi düzeltir)", () => {
    const s = applyNotificationsChange(durum(), { ids: [99] });
    expect(s.unreadCount).toBe(3);
  });

  it("sayı negatife düşmez; boş değişiklik durumu aynen döndürür", () => {
    const eksik = { unreadCount: 0, notifications: [n(1, false)] };
    expect(applyNotificationsChange(eksik, { ids: [1] }).unreadCount).toBe(0);
    const d = durum();
    expect(applyNotificationsChange(d, {})).toBe(d);
  });

  it("girdiyi değiştirmez", () => {
    const d = durum();
    applyNotificationsChange(d, { all: true });
    expect(d.notifications[0].isRead).toBe(false);
  });
});
