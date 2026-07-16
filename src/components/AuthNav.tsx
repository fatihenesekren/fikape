"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { NotificationBell } from "@/components/NotificationBell";

export function AuthNav() {
  const { data: session, status } = useSession();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  if (status === "loading") return null;

  if (session) {
    const isAdmin = (session.user.trustLevel as number) >= 5;

    return (
      <div className="flex items-center gap-2">
        {isAdmin && (
          <Link
            href="/admin/yorumlar"
            className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
          >
            Admin
          </Link>
        )}
        <Link
          href="/garajim"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
        >
          Garajım
        </Link>
        <Link
          href="/profil"
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
        >
          {session.user.name ?? "Profil"}
        </Link>
        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-md hover:bg-gray-50 transition-colors hidden sm:block"
        >
          Çıkış
        </button>

        <NotificationBell />

        {/* Mobil hesap menüsü — Admin/Garajım/Profil/Çıkış masaüstünde header'da inline,
            mobilde hidden sm:block ile gizli olduğu için buraya toplanıyor. */}
        <div className="relative sm:hidden" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Hesap menüsü"
            aria-expanded={menuOpen}
          >
            <Avatar
              displayName={session.user.name ?? null}
              avatarUrl={session.user.image}
              seed={session.user.email ?? session.user.id}
              size={32}
            />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              {isAdmin && (
                <Link
                  href="/admin/yorumlar"
                  onClick={() => setMenuOpen(false)}
                  className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
                >
                  Admin
                </Link>
              )}
              <Link
                href="/garajim"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Garajım
              </Link>
              <Link
                href="/profil"
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                {session.user.name ?? "Profil"}
              </Link>
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50"
              >
                Çıkış
              </button>
            </div>
          )}
        </div>

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
