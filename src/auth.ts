import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { getClientIp } from "@/lib/security";
import { verifyCredentials } from "@/lib/verifyCredentials";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "E-posta", type: "email" },
        password: { label: "Şifre",  type: "password" },
      },
      async authorize(credentials, request) {
        if (!credentials?.email || !credentials?.password) return null;
        const ip = getClientIp(request);
        return verifyCredentials(credentials.email as string, credentials.password as string, ip);
      },
    }),
  ],
  pages: {
    signIn: "/giris",
  },
  // Varsayılan (30 gün) yerine bilinçli bir süre: çalınan/paylaşılan bir cihazda
  // oturumun açık kalma penceresini sınırlar. updateAge ile aktif kullanıcıda
  // sessizce yenilenir, pasif bırakılırsa maxAge'de düşer.
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 14, // 14 gün
    updateAge: 60 * 60 * 24,   // 1 gün
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id         = user.id;
        token.trustLevel = (user as { trustLevel?: number }).trustLevel ?? 1;
        token.picture     = (user as { image?: string | null }).image ?? null;
        token.pwdChangedAt = (user as { passwordChangedAt?: number | null }).passwordChangedAt ?? null;
        token.pwdCheckedAt = Date.now();
      } else if (token.id) {
        // Şifre bu oturum açıldıktan SONRA değiştirildiyse (reset-password akışı
        // passwordChangedAt'i günceller) eski JWT'yi geçersiz kıl. jwt() callback'i
        // her `auth()` çağrısında (yani hemen hemen her sayfa yüklemesinde) tekrar
        // çalıştığı için bu kontrolü HER istekte yapmak site genelinde gözle görülür
        // bir yavaşlığa yol açtı — bu yüzden en fazla 5 dakikada bir DB'ye gidiyor.
        // Güvenlik penceresi: şifre değişikliği en geç 5 dakika içinde eski oturumu düşürür.
        const lastChecked = (token.pwdCheckedAt as number | undefined) ?? 0;
        if (Date.now() - lastChecked > 5 * 60 * 1000) {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { passwordChangedAt: true },
          });
          const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
          if (dbChangedAt !== ((token.pwdChangedAt as number | null | undefined) ?? null)) {
            return null;
          }
          token.pwdCheckedAt = Date.now();
        }
      }
      if (trigger === "update") {
        // update({ name: "..." }) / update({ image: "..." }) ile gelen veriyi doğrudan kullan
        const s = session as { name?: string; image?: string | null } | undefined;
        let handled = false;
        if (s?.name) {
          token.name = s.name;
          handled = true;
        }
        if (s && "image" in s) {
          token.picture = s.image ?? null;
          handled = true;
        }
        if (!handled && token.id) {
          const dbUser = await prisma.user.findUnique({
            where: { id: Number(token.id) },
            select: { displayName: true, email: true },
          });
          if (dbUser) token.name = dbUser.displayName ?? dbUser.email;
        }
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id         = token.id as string;
        session.user.trustLevel = token.trustLevel as number;
        session.user.name       = (token.name as string) ?? session.user.email;
        session.user.image      = (token.picture as string | null | undefined) ?? null;
      }
      return session;
    },
  },
});
