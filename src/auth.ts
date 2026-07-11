import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: "E-posta", type: "email" },
        password: { label: "Şifre",  type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;
        return {
          id:          String(user.id),
          email:       user.email,
          name:        user.displayName ?? user.email,
          image:       user.avatarUrl ?? null,
          trustLevel:  user.trustLevel,
        };
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
