import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import { SessionProvider } from "@/components/SessionProvider";
import { AuthNav } from "@/components/AuthNav";
import { VerificationBanner } from "@/components/VerificationBanner";
import { SearchBar, SearchIcon } from "@/components/SearchBar";
import { FooterNav } from "@/components/FooterNav";
import { HomeFab } from "@/components/HomeFab";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { JsonLd } from "@/components/JsonLd";
import { BASE_URL } from "@/lib/baseUrl";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: {
    default: "fikape — Gerçek Araç Yorumları",
    template: "%s | fikape",
  },
  description:
    "Türkiye'nin araç yorum platformu. Fiyat, Kalite ve Performans puanlarıyla gerçek kullanıcı deneyimleri.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL ?? process.env.AUTH_URL ?? "https://fikape-e4t7.vercel.app"),
  openGraph: {
    siteName: "fikape",
    locale: "tr_TR",
    type: "website",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  let unverifiedEmail: string | null = null;

  if (session?.user?.id) {
    const user = await prisma.user.findUnique({
      where: { id: Number(session.user.id) },
      select: { email: true, emailVerifiedAt: true },
    });
    if (user && !user.emailVerifiedAt) {
      unverifiedEmail = user.email;
    }
  }

  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[--background]">
        <JsonLd
          data={{
            "@context": "https://schema.org",
            "@graph": [
              {
                "@type": "Organization",
                name: "fikape",
                url: BASE_URL,
              },
              {
                "@type": "WebSite",
                name: "fikape",
                url: BASE_URL,
                potentialAction: {
                  "@type": "SearchAction",
                  target: `${BASE_URL}/arama?q={search_term_string}`,
                  "query-input": "required name=search_term_string",
                },
              },
            ],
          }}
        />
        <SessionProvider>
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0.5 text-xl font-black tracking-tight select-none">
              <span style={{ color: "#185FA5" }}>fi</span>
              <span className="text-gray-300 font-light">·</span>
              <span style={{ color: "#3B6D11" }}>ka</span>
              <span className="text-gray-300 font-light">·</span>
              <span style={{ color: "#993C1D" }}>pe</span>
            </Link>

            <SearchBar />
            <div className="flex items-center gap-1">
              <SearchIcon />
              <AuthNav />
            </div>
          </div>
        </header>

        {unverifiedEmail && <VerificationBanner email={unverifiedEmail} />}

        <main className="flex-1 flex flex-col">{children}</main>

        <footer className="border-t border-gray-100 py-6">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400 space-y-2">
            <FooterNav />
            <p>© {new Date().getFullYear()} fikape.com · Tüm hakları saklıdır.</p>
          </div>
        </footer>
        <HomeFab />
        </SessionProvider>
      </body>
    </html>
  );
}
