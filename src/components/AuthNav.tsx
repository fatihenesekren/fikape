"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { Avatar } from "@/components/Avatar";
import { NotificationBell } from "@/components/NotificationBell";

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6z" />
    </svg>
  );
}

// Garaj — çatılı bina + panelli kapı. "car" ikonu araç yorumlarıyla karışabildiği
// için kullanıcı tercihiyle bilinçli olarak bu şekil seçildi.
function GarageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 10 L12 3 L21 10 L21 21 L3 21 Z" />
      <rect x="8.5" y="12.5" width="7" height="8.5" />
      <line x1="8.5" y1="15.5" x2="15.5" y2="15.5" />
      <line x1="8.5" y1="18.5" x2="15.5" y2="18.5" />
    </svg>
  );
}

function PlusCircleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

function ChevronDown() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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
    const menuItemClass = "flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors";

    return (
      <div className="flex items-center gap-1.5">
        <NotificationBell />

        {/* Hesap menüsü — masaüstü/mobil ortak, avatar tetikliyor.
            Admin/Garajım/Profilim/Çıkış tek listede, iki ayrı yapı bakımı gerekmiyor. */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="Hesap menüsü"
            aria-expanded={menuOpen}
            className="flex items-center gap-0.5 p-1 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Avatar
              displayName={session.user.name ?? null}
              avatarUrl={session.user.image}
              seed={session.user.email ?? session.user.id}
              size={30}
            />
            <span className="text-gray-400"><ChevronDown /></span>
          </button>

          {menuOpen && (
            <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 top-full mt-2 w-52 max-w-[calc(100vw-2rem)] bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              {isAdmin && (
                <Link href="/admin/yorumlar" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                  <ShieldIcon /> Admin
                </Link>
              )}
              <Link href="/garajim" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                <GarageIcon /> Garajım
              </Link>
              {/* Araç Öner masaüstünde header'da ayrı buton olarak zaten görünüyor —
                  mobilde header'da yer olmadığı için sadece bu menüde tekrarlanıyor. */}
              <Link href="/oner" onClick={() => setMenuOpen(false)} className={`sm:hidden ${menuItemClass}`}>
                <PlusCircleIcon /> Araç Öner
              </Link>
              <Link href="/profil" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                <UserIcon /> Profilim
              </Link>
              <div className="border-t border-gray-100 my-1" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  signOut({ callbackUrl: "/" });
                }}
                className={`w-full text-left ${menuItemClass}`}
              >
                <LogoutIcon /> Çıkış
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
        <Link
          href="/oner"
          className="hidden sm:inline-flex px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
          style={{ background: "#EAF2FB", color: "#185FA5" }}
        >
          Araç Öner
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
