import type { Metadata } from "next";

// Sayfa istemci bileşeni ("use client") olduğu için metadata burada, sunucu layout'unda tanımlanır.
export const metadata: Metadata = {
  title: "Şifre Sıfırla",
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
