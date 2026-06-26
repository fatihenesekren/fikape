"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  badge?: number;
  icon: string;
}

export function AdminNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  async function handleRevalidate() {
    await fetch("/api/admin/revalidate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    alert("Cache temizlendi.");
  }

  return (
    <aside className="w-56 shrink-0 flex flex-col min-h-screen bg-white border-r border-gray-100">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-100">
        <Link href="/" className="text-sm font-black tracking-tight">
          <span style={{ color: "#0C447C" }}>fi</span>
          <span style={{ color: "#27500A" }}>·ka·</span>
          <span style={{ color: "#712B13" }}>pe</span>
        </Link>
        <p className="text-[10px] text-gray-400 mt-0.5 font-medium uppercase tracking-widest">Admin Panel</p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                active
                  ? "bg-gray-900 text-white"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span>{item.icon}</span>
                <span>{item.label}</span>
              </span>
              {item.badge != null && item.badge > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${
                  active ? "bg-white/20 text-white" : "bg-orange-100 text-orange-700"
                }`}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Alt */}
      <div className="px-3 py-4 border-t border-gray-100 space-y-1">
        <button
          onClick={handleRevalidate}
          className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors text-left"
        >
          <span>🔄</span>
          <span>Cache Temizle</span>
        </button>
        <Link
          href="/"
          className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <span>←</span>
          <span>Siteye Dön</span>
        </Link>
      </div>
    </aside>
  );
}
