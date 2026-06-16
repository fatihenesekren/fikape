"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";

export function AuthNav() {
  const { data: session, status } = useSession();

  if (status === "loading") return null;

  if (session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/garajim"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
        >
          🚗 Garajım
        </Link>
        <Link
          href="/profil"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
        >
          {session.user.name ?? "Profil"}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
        >
          Çıkış
        </button>
        <Link
          href="/yorum-yaz"
          className="px-3 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
          style={{ background: "#111" }}
        >
          Yorum Yaz
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <Link
        href="/giris"
        className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors"
      >
        Giriş yap
      </Link>
      <Link
        href="/kayit"
        className="px-3 py-1.5 text-sm font-semibold text-white rounded-md transition-colors"
        style={{ background: "#111" }}
      >
        Kayıt ol
      </Link>
    </div>
  );
}
