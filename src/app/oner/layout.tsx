import type { Metadata } from "next";

// Sayfa istemci bileşeni ("use client") olduğu için metadata burada, sunucu layout'unda tanımlanır.
export const metadata: Metadata = {
  title: "Araç Öner",
  robots: { index: false, follow: true }, // giriş gerektirir; sitemap'te de yok
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
