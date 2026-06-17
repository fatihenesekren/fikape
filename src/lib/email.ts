import { Resend } from "resend";

const LOGO = `<span style="font-size:22px;font-weight:900;letter-spacing:-1px"><span style="color:#185FA5">fi</span><span style="color:#ccc">·</span><span style="color:#3B6D11">ka</span><span style="color:#ccc">·</span><span style="color:#993C1D">pe</span></span>`;

const FROM = process.env.EMAIL_FROM ?? "fikape <onboarding@resend.dev>";
const BASE_URL = process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? "https://fikape-e4t7.vercel.app";

export async function sendReminderEmail({
  to, displayName, vehicleName, productSlug,
}: {
  to: string;
  displayName: string | null;
  vehicleName: string;
  productSlug: string;
}) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${BASE_URL}/yorum-yaz?arac=${productSlug}`;
  const name = displayName ?? "Merhaba";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `${vehicleName} — 3 aydır ne düşünüyorsun?`,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        ${LOGO}
        <h1 style="font-size:20px;font-weight:700;color:#111;margin:24px 0 8px">
          ${name}, ${vehicleName} nasıl gidiyor?
        </h1>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 16px">
          Garajına <strong>${vehicleName}</strong> ekleyeli yaklaşık 3 ay oldu.
          Şimdiye kadar edindiklerini paylaşmak ister misin?
        </p>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
          Yorumun, aynı aracı almayı düşünen kullanıcılara gerçek bir ışık olur —
          fiyat, kalite ve performans puanlarınla.
        </p>
        <a href="${url}" style="display:inline-block;background:#111;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none">
          Yorum yaz →
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px;line-height:1.6">
          Bu hatırlatmayı almak istemiyorsan hesap ayarlarından bildirim tercihlerini güncelleyebilirsin.
          <br>© ${new Date().getFullYear()} fikape.com
        </p>
      </div>
    `,
  });
}

export async function sendVerificationEmail(email: string, token: string) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "fikape — E-posta adresinizi doğrulayın",
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
        <div style="font-size:28px;font-weight:900;letter-spacing:-1px;margin-bottom:24px">
          <span style="color:#185FA5">fi</span><span style="color:#ccc">·</span><span style="color:#3B6D11">ka</span><span style="color:#ccc">·</span><span style="color:#993C1D">pe</span>
        </div>
        <h1 style="font-size:20px;font-weight:700;color:#111;margin:0 0 8px">E-posta adresinizi doğrulayın</h1>
        <p style="color:#555;font-size:15px;line-height:1.6;margin:0 0 24px">
          Hesabınızı doğrulamak için aşağıdaki butona tıklayın. Link 24 saat geçerlidir.
        </p>
        <a href="${url}" style="display:inline-block;background:#111;color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:10px;text-decoration:none">
          E-postamı doğrula →
        </a>
        <p style="color:#aaa;font-size:12px;margin-top:32px">
          Bu e-postayı siz talep etmediyseniz görmezden gelebilirsiniz.
        </p>
      </div>
    `,
  });
}
