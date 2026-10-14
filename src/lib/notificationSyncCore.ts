// Bildirim zili ile bildirim listesi arasındaki anlık eşitleme — React'siz saf kısım (birim test edilebilir).
// Zil layout'ta yaşayan kalıcı bir bileşen; /bildirimler ve profil listesi bildirimleri okundu işaretleyince
// zilin bunu hemen öğrenmesi için "fikape:notifications-changed" olayı yayılır (yalnız okundu işareti SUNUCUDA
// başarılı olduktan sonra).

export const NOTIFICATIONS_CHANGED_EVENT = "fikape:notifications-changed";

/** ids: yalnız bu bildirimler okundu; all: tümü okundu. */
export type NotificationsChange = { ids?: number[]; all?: boolean };

export function emitNotificationsChanged(change: NotificationsChange): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<NotificationsChange>(NOTIFICATIONS_CHANGED_EVENT, { detail: change }));
}

type State<T> = { unreadCount: number; notifications: T[] };

/**
 * Olayı zilin durumuna iyimser uygular. Sayı yalnızca listede GÖRÜNEN okunmamışlar için düşer; listede olmayan
 * (örn. 2. sayfadaki) bildirimlerin sayısı bilinmediğinden bunu hemen ardından gelen sunucu yenilemesi düzeltir.
 */
export function applyNotificationsChange<T extends { id: number; isRead: boolean }>(
  state: State<T>,
  change: NotificationsChange,
): State<T> {
  if (change.all) {
    return { unreadCount: 0, notifications: state.notifications.map((n) => (n.isRead ? n : { ...n, isRead: true })) };
  }
  const hedef = new Set(change.ids ?? []);
  if (hedef.size === 0) return state;
  let dusen = 0;
  const notifications = state.notifications.map((n) => {
    if (!hedef.has(n.id) || n.isRead) return n;
    dusen++;
    return { ...n, isRead: true };
  });
  return { unreadCount: Math.max(0, state.unreadCount - dusen), notifications };
}
