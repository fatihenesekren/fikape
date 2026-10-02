"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  badge?: number;
  icon: string;
}

// En sık kullanılan 4 öğe alt çubukta kalır; geri kalanı "Menü" sekmesinin açtığı alt panelde listelenir
// (17 öğe tek çubuğa sığmıyordu). Gizli öğelerin rozetleri "Menü" üzerinde toplanır.
const ANA_ADRESLER = ["/admin/yorumlar", "/admin/oneriler", "/admin/katalog", "/admin/leads"];

export function AdminBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const [acik, setAcik] = useState(false);
  const [oncekiYol, setOncekiYol] = useState(pathname);
  // Sayfa değişince panel kapanır (render sırasında durum eşitleme)
  if (oncekiYol !== pathname) { setOncekiYol(pathname); setAcik(false); }

  useEffect(() => {
    if (!acik) return;
    const kapat = (e: KeyboardEvent) => { if (e.key === "Escape") setAcik(false); };
    document.addEventListener("keydown", kapat);
    return () => document.removeEventListener("keydown", kapat);
  }, [acik]);

  const aktifMi = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const ana = ANA_ADRESLER.map((h) => items.find((i) => i.href === h)).filter((i): i is NavItem => !!i);
  const digerleri = items.filter((i) => !ana.includes(i));
  const digerRozet = digerleri.reduce((t, i) => t + (i.badge ?? 0), 0);
  const menuAktif = acik || digerleri.some((i) => aktifMi(i.href));

  const sekme = "relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors";

  return (
    <>
      {acik && (
        <div className="md:hidden fixed inset-0 z-40">
          <button aria-label="Menüyü kapat" onClick={() => setAcik(false)} className="absolute inset-0 bg-black/40" />
          <div
            role="dialog"
            aria-label="Admin menüsü"
            className="absolute inset-x-0 bottom-0 max-h-[75vh] overflow-y-auto rounded-t-2xl bg-white p-3 shadow-xl"
            style={{ paddingBottom: "calc(4.5rem + env(safe-area-inset-bottom))" }}
          >
            <ul className="grid grid-cols-2 gap-2">
              {digerleri.map((item) => (
                <li key={item.href} className="min-w-0">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-2 rounded-xl px-3 py-3 text-sm font-medium ${
                      aktifMi(item.href) ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {item.badge != null && item.badge > 0 && (
                      <span className="shrink-0 rounded-full bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">{item.badge}</span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-50 flex bg-white border-t border-gray-100"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {ana.map((item) => {
          const active = aktifMi(item.href) && !acik;
          return (
            <Link key={item.href} href={item.href} className={`${sekme} ${active ? "text-gray-900" : "text-gray-400"}`}>
              {active && <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gray-900" />}
              <span className="relative text-lg leading-none">
                {item.icon}
                {item.badge != null && item.badge > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-orange-500" />}
              </span>
              <span className="truncate max-w-full px-0.5">{item.shortLabel ?? item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setAcik((a) => !a)}
          aria-expanded={acik}
          className={`${sekme} ${menuAktif ? "text-gray-900" : "text-gray-400"}`}
        >
          {menuAktif && <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gray-900" />}
          <span className="relative text-lg leading-none">
            ☰
            {digerRozet > 0 && <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-orange-500" />}
          </span>
          <span>Menü</span>
        </button>
      </nav>
    </>
  );
}
