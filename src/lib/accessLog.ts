import { prisma } from "@/lib/prisma";
import { encryptIp, getClientIp } from "@/lib/security";

// 5651 sayılı Kanun m.5 "yer sağlayıcı" trafik bilgisi yükümlülüğü — yetkili
// merci talebinde sunulmak üzere kimliği tanımlayabilir erişim kaydı tutulur.
// Bilinçli olarak SADECE kritik "işlem" niteliğindeki route'larda çağrılır
// (kayıt, giriş, yorum/ilan/mesaj oluşturma); genel sayfa görüntülemesi
// loglanmaz — hem yazma hacmini kontrollü tutmak hem de KVKK minimum veri
// ilkesiyle dengelemek için (bkz. prisma/schema.prisma AccessLog notu).
//
// ipAddress DB'de AES-256-GCM ile şifreli tutulur (bkz. security.ts encryptIp/
// decryptIp) — ne tek yönlü hash (5651'in "kaynağı tanımlama" şartını karşılamaz)
// ne de düz metin (DB sızıntısında doğrudan kişisel veri ifşası). Yasal talep
// halinde decryptIp() ile çözülür.
//
// Loglama başarısız olursa asıl isteği ASLA düşürmez — sadece konsola yazar.
export type AccessLogAction =
  | "REGISTER"
  | "LOGIN"
  | "REVIEW_CREATE"
  | "TRADE_LISTING_CREATE"
  | "TRADE_MESSAGE_CREATE";

async function writeAccessLog(params: {
  action: AccessLogAction;
  userId?: number | null;
  ip: string | null;
  userAgent?: string | null;
  method: string;
  path: string;
}): Promise<void> {
  try {
    if (!params.ip) return; // IP yoksa (ör. test ortamı) yazılabilir bir trafik kaydı yok

    await prisma.accessLog.create({
      data: {
        userId: params.userId ?? null,
        ipAddress: encryptIp(params.ip),
        userAgent: params.userAgent?.slice(0, 255) ?? null,
        method: params.method,
        path: params.path.slice(0, 255), // query string bilinçli olarak dışarıda
        action: params.action,
      },
    });
  } catch (err) {
    console.error("logAccess failed:", err);
  }
}

// Standart API route kullanımı — Request nesnesinden path/IP/UA çıkarır.
export async function logAccess(
  req: Request,
  params: { action: AccessLogAction; userId?: number | null; ip?: string | null }
): Promise<void> {
  const url = new URL(req.url);
  await writeAccessLog({
    action: params.action,
    userId: params.userId,
    ip: params.ip ?? getClientIp(req),
    userAgent: req.headers.get("user-agent"),
    method: req.method,
    path: url.pathname,
  });
}

// NextAuth authorize() gibi ham bir Request nesnesi vermeyen akışlar için —
// (bkz. lib/verifyCredentials.ts) sadece IP zaten elde.
export async function logAccessRaw(params: {
  action: AccessLogAction;
  userId?: number | null;
  ip: string | null;
  path: string;
}): Promise<void> {
  await writeAccessLog({ ...params, method: "POST" });
}

// Yasal talep (mahkeme/savcılık/BTK) halinde tek satır çözmek için — admin
// panelde ya da elle kullanılacak, uygulama akışında çağrılmaz.
export { decryptIp } from "@/lib/security";
