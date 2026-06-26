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
      }
      if (trigger === "update") {
        // update({ name: "..." }) ile gelen veriyi doğrudan kullan
        if ((session as { name?: string })?.name) {
          token.name = (session as { name: string }).name;
        } else if (token.id) {
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
      }
      return session;
    },
  },
});
