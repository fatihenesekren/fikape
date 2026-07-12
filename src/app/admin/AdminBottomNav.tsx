"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  shortLabel?: string;
  badge?: number;
  icon: string;
}

// Mobilde (md altı) sidebar yerine — 4 öğe zaten sığdığı için yatay kaydırma
// yerine sabit alt tab bar kullanılıyor (bkz. tasarım incelemesi: az öğede
// yatay scroll keşfedilemez ve rozet taşıyan kritik öğeler kesilebilir).
export function AdminBottomNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 flex bg-white border-t border-gray-100"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      {items.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`relative flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
              active ? "text-gray-900" : "text-gray-400"
            }`}
          >
            {active && <span className="absolute top-0 inset-x-4 h-0.5 rounded-full bg-gray-900" />}
            <span className="relative text-lg leading-none">
              {item.icon}
              {item.badge != null && item.badge > 0 && (
                <span className="absolute -top-1 -right-1.5 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </span>
            <span className="truncate max-w-full px-0.5">{item.shortLabel ?? item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
