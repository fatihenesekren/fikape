import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "fikape — Gerçek Kullanıcı Yorumları",
  description:
    "Fiyat · Kalite · Performans. Araçlar için gerçek sahip deneyimleri.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-[--background]">
        <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-0.5 text-xl font-black tracking-tight select-none">
              <span style={{ color: "#185FA5" }}>fi</span>
              <span className="text-gray-300 font-light">·</span>
              <span style={{ color: "#3B6D11" }}>ka</span>
              <span className="text-gray-300 font-light">·</span>
              <span style={{ color: "#993C1D" }}>pe</span>
            </Link>

            <nav className="flex items-center gap-1">
              <Link
                href="/araclar"
                className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
              >
                Araçlar
              </Link>
              <Link
                href="/yorum-yaz"
                className="px-3 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
                style={{ background: "#111" }}
              >
                Yorum Yaz
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t border-gray-100 py-8 mt-16">
          <div className="max-w-7xl mx-auto px-4 text-center text-xs text-gray-400 space-y-1">
            <div className="flex items-center justify-center gap-0.5 font-black text-base mb-2">
              <span style={{ color: "#185FA5" }}>fi</span>
              <span className="text-gray-600 font-light">·</span>
              <span style={{ color: "#3B6D11" }}>ka</span>
              <span className="text-gray-600 font-light">·</span>
              <span style={{ color: "#993C1D" }}>pe</span>
            </div>
            <p>FIyat · KAlite · PErformans — Gerçek kullanıcılar, gerçek deneyimler.</p>
            <p>© {new Date().getFullYear()} fikape.com · Tüm hakları saklıdır.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
