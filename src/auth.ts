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
    jwt({ token, user }) {
      if (user) {
        token.id         = user.id;
        token.trustLevel = (user as { trustLevel?: number }).trustLevel ?? 1;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) {
        session.user.id         = token.id as string;
        session.user.trustLevel = token.trustLevel as number;
      }
      return session;
    },
  },
});
