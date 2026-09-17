"use client";

import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Avatar } from "@/components/Avatar";
import { NotificationBell } from "@/components/NotificationBell";
import { MessageBell } from "@/components/MessageBell";
import { MessageIcon } from "@/components/icons";
import { useAnchoredPosition } from "@/lib/useAnchoredPosition";

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

// Usta Panelim — İngiliz anahtarı, hub sayfasının kendi başlığındaki (🔧)
// ikonla aynı fikri taşıyor, diğer menü ikonlarıyla aynı outline SVG stilde.
function WrenchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
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

// MessageIcon artık src/components/icons.tsx'te — burada yalnız import
// edilip kullanılıyor (kuyruklu balon: header'da 20px, menüde 16px).
export { MessageIcon };

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
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isActiveExpert, setIsActiveExpert] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuBtnRef = useRef<HTMLButtonElement>(null);
  const pathname = usePathname();
  const menuStyle = useAnchoredPosition(menuBtnRef, menuOpen, 208);

  // Usta durumu JWT'de yok (bkz. src/app/api/me/expert-status/route.ts) —
  // MessageBell'deki gibi hafif bir client fetch, mount'ta bir kez.
  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;
    fetch("/api/me/expert-status")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => { if (!cancelled && data) setIsActiveExpert(!!data.isActiveExpert); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [session?.user?.id]);

  // Sayfa değişince menü her zaman kapansın (bkz. NotificationBell'deki aynı
  // düzeltme) — effect yerine "prop değişince render sırasında state ayarla"
  // deseni (React docs), cascading-render uyarısı vermiyor.
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setMenuOpen(false);
  }

  // Okunmamış mesaj sayacı artık MessageBell'in kendi /api/messages/preview
  // fetch'inden geliyor (onUnreadCountChange) — ayrı bir polling'e gerek
  // kalmadı, tek istekle hem sayaç hem önizleme dolduruluyor.

  // Sekme başlığında okunmamış sayacı — "(3) fikape — …". Next metadata
  // navigasyonda başlığı sıfırlayabildiği için 5 sn'de bir yeniden uygula.
  useEffect(() => {
    const apply = () => {
      const base = document.title.replace(/^\(\d+\+?\)\s+/, "");
      document.title = unreadMessages > 0 ? `(${unreadMessages > 9 ? "9+" : unreadMessages}) ${base}` : base;
    };
    apply();
    const iv = setInterval(apply, 5000);
    return () => clearInterval(iv);
  }, [unreadMessages]);

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

        {/* Mesaj ikonu artık zil gibi bir önizleme paneli açıyor (kullanıcı
            fark etti — önceden düz bir /mesajlar linkiydi), bildirim çanıyla
            aynı şekilde masaüstü+mobil HER boyutta görünür (3 ajanlı denetim
            bulgusu: önceden yalnız masaüstündeydi, zille asimetrikti).
            Okunmamış sayacı buradan (onUnreadCountChange) yukarı bildirilip
            sekme başlığı için de kullanılıyor. */}
        <MessageBell onUnreadCountChange={setUnreadMessages} />

        {/* Hesap menüsü — masaüstü/mobil ortak, avatar tetikliyor.
            Admin/Garajım/Profilim/Çıkış tek listede, iki ayrı yapı bakımı gerekmiyor. */}
        <div className="relative" ref={menuRef}>
          <button
            ref={menuBtnRef}
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
            /* CSS tahminiyle konumlama (absolute right-0, sonra fixed right-4,
               sonra header kenarını hesaplayan calc()) hep BİR senaryoda
               kırıldı — hiçbiri butonun gerçek konumunu bilmiyordu, panel bazen
               tıklanan butondan tamamen başka bir yerde (başka bir butonun
               altında) görünüyordu (kullanıcı gösterdi). useAnchoredPosition
               artık triggerRef'in getBoundingClientRect()'ini ölçüp paneli
               GERÇEKTEN o butona göre konumlandırıyor. */
            <div style={menuStyle} className="bg-white border border-gray-100 rounded-xl shadow-lg py-1 z-50">
              {isAdmin && (
                <Link href="/admin/yorumlar" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                  <ShieldIcon /> Admin
                </Link>
              )}
              <Link href="/garajim" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                <GarageIcon /> Garajım
              </Link>
              {isActiveExpert && (
                <Link href="/usta-gorusu" onClick={() => setMenuOpen(false)} className={menuItemClass}>
                  <WrenchIcon /> Usta Panelim
                </Link>
              )}
              {/* "Mesajlarım" hesap menüsündeki ayrı girişi kaldırıldı — MessageBell
                  artık masaüstü+mobil HER boyutta görünür (3 ajanlı denetim
                  bulgusu: bildirim çanı her yerde çalışıyordu, mesaj ikonu
                  yalnız masaüstündeydi, asimetrikti), menüdeki kopya gereksiz
                  hale geldi. */}
              {/* Araç Öner: yalnız ≥1024px'te header'da ayrı buton var
                  (tablet sıkışıklığı düzeltmesi — yukarıdaki yorum), bu
                  aralığın altında (mobil DAHİL 640-1024 tablet) yer
                  olmadığı için sadece bu menüde. (Yorum Yaz header'da kalıyor.) */}
              <Link
                href="/oner"
                onClick={() => setMenuOpen(false)}
                className={`lg:hidden ${menuItemClass}`}
                style={{ color: "var(--fi)" }}
              >
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

        {/* Dar mobil genişliklerde (ör. 412px) metin butonu diğer header
            öğeleriyle (zil, mesaj, avatar) sığmayıp 2 satıra bölünüyor ve
            sabit yükseklikli header'ın dışına taşıyordu (kullanıcı ekran
            görüntüsüyle gösterdi). sm altında yalnız kalem ikonu, sm ve
            üstünde metinle birlikte — buton hiçbir zaman sarmıyor. */}
        <Link
          href="/yorum-yaz"
          aria-label="Yorum Yaz"
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 sm:py-1.5 text-sm font-semibold text-white rounded-md transition-colors whitespace-nowrap"
          style={{ background: "#111" }}
        >
          <PencilIcon />
          <span className="hidden sm:inline">Yorum Yaz</span>
        </Link>
        {/* Canlıda 768-1024px (tablet) aralığında test edildi: MessageBell +
            NotificationBell + hesap menüsü + Yorum Yaz + bu buton + arama
            kutusu üst üste binince arama placeholder'ı ("Araç, marka veya
            model ara...") kesiliyordu (kullanıcı isteğiyle gerçek tarayıcıda
            doğrulandı — 3 ajanlı denetimin "görsel doğrulama gerekir" dediği
            madde). Eşik sm(640)→lg(1024) yükseltildi, hesap menüsündeki
            yedek giriş de buna göre genişletildi (aşağıda). */}
        <Link
          href="/oner"
          className="hidden lg:inline-flex px-3 py-1.5 text-sm font-semibold rounded-md transition-colors"
          style={{ background: "var(--fi-bg)", color: "var(--fi)" }}
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
