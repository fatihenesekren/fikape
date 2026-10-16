import { after } from "next/server";

/**
 * İşi yanıttan SONRAYA bırakır (Next.js after()). Yanıt süresini işin süresinden ayırır: örn. e-posta gönderimi için
 * "hesap var/yok" bilgisi yanıt süresinden anlaşılmasın. İstek kapsamı dışında (testler, betikler) after() fırlatır;
 * o durumda iş bekletilmeden, hatası yutulacak şekilde başlatılır.
 */
export function arkaPlandaCalistir(is: () => Promise<unknown>): void {
  const guvenli = async () => { try { await is(); } catch (e) { console.error("[arkaPlan]", e); } };
  try {
    after(guvenli);
  } catch {
    void guvenli();
  }
}
