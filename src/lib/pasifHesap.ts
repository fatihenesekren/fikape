// Pasif hesap kuralı (Üyelik Sözleşmesi md.7, Kullanım Koşulları md.8): 24 ay boyunca hiç giriş
// yapılmayan hesap askıya alınabilir. Uygulamada: askıdan 30 gün önce e-postayla uyarılır; uyarıdan
// en az 30 gün geçmiş ve hâlâ etkinlik yoksa askıya alınır. Hiçbir veri silinmez; askı, şifre sıfırlama
// (e-posta sahipliği kanıtı) ile kalkar. Yönetici hesaplarına dokunulmaz.

export const PASIF_AY = 24;
export const UYARI_GUN = 30;
/** Oturum yenilenirken lastActiveAt en fazla bu sıklıkta yazılır. */
export const ETKINLIK_YAZIM_ARALIGI_MS = 24 * 60 * 60 * 1000;

const GUN_MS = 24 * 60 * 60 * 1000;

/** Giriş/etkinlik anı bu eşikten eskiyse hesap pasiftir (askı eşiği). */
export function askiEsigi(simdi: Date): Date {
  const d = new Date(simdi);
  d.setUTCMonth(d.getUTCMonth() - PASIF_AY);
  return d;
}

/** Bu eşikten eski etkinlik → uyarı gönderilir (askı eşiğinden UYARI_GUN gün önce). */
export function uyariEsigi(simdi: Date): Date {
  return new Date(askiEsigi(simdi).getTime() + UYARI_GUN * GUN_MS);
}

/** Uyarı bu tarihten önce gönderildiyse bildirim süresi dolmuştur. */
export function uyariSuresiDolduEsigi(simdi: Date): Date {
  return new Date(simdi.getTime() - UYARI_GUN * GUN_MS);
}

export type PasifDurum = "aktif" | "uyari" | "askiya";

export function pasifDurumu(
  u: {
    lastActiveAt: Date | null;
    createdAt: Date;
    inactiveWarnedAt: Date | null;
    inactiveSuspendedAt: Date | null;
    trustLevel: number;
    isBanned: boolean;
  },
  simdi: Date,
): PasifDurum {
  if (u.inactiveSuspendedAt) return "askiya";
  if (u.trustLevel >= 5 || u.isBanned) return "aktif";
  const son = u.lastActiveAt ?? u.createdAt;
  if (son.getTime() >= uyariEsigi(simdi).getTime()) return "aktif";
  const askidaOlmali =
    son.getTime() < askiEsigi(simdi).getTime() &&
    !!u.inactiveWarnedAt &&
    u.inactiveWarnedAt.getTime() <= uyariSuresiDolduEsigi(simdi).getTime();
  return askidaOlmali ? "askiya" : "uyari";
}

/** Doğru parolayla girmeye çalışan askıdaki hesap için fırlatılır (bkz. verifyCredentials, auth.ts). */
export class PasifHesapAskida extends Error {
  constructor() {
    super("pasif_hesap_askida");
    this.name = "PasifHesapAskida";
  }
}
