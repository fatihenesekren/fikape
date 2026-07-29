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
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id         = user.id;
        token.trustLevel = (user as { trustLevel?: number }).trustLevel ?? 1;
        token.picture     = (user as { image?: string | null }).image ?? null;
        token.pwdChangedAt = (user as { passwordChangedAt?: number | null }).passwordChangedAt ?? null;
      } else if (token.id) {
        // Şifre bu oturum açıldıktan SONRA değiştirildiyse (reset-password akışı
        // passwordChangedAt'i günceller) eski JWT'yi geçersiz kıl — hesap ele
        // geçirilip şifre kurban tarafından sıfırlansa bile saldırganın eski
        // oturum çerezi artık çalışmaz.
        const dbUser = await prisma.user.findUnique({
          where: { id: Number(token.id) },
          select: { passwordChangedAt: true },
        });
        const dbChangedAt = dbUser?.passwordChangedAt?.getTime() ?? null;
        if (dbChangedAt !== ((token.pwdChangedAt as number | null | undefined) ?? null)) {
          return null;
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
