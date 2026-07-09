"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const FOOTER_LINKS = [
  { href: "/nasil-calisir", label: "Nasıl Çalışır" },
  { href: "/karsilastir", label: "Karşılaştır" },
  { href: "/plus", label: "Plus" },
  { href: "/gelistiriciler", label: "API" },
  { href: "/gizlilik", label: "Gizlilik Politikası" },
  { href: "/kullanim-kosullari", label: "Kullanım Koşulları" },
];

export function FooterNav() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-2">
      {FOOTER_LINKS.map((link, i) => {
        const isActive = pathname === link.href;
        return (
          <Fragment key={link.href}>
            {i > 0 && <span>·</span>}
            <Link
              href={link.href}
              className={
                isActive
                  ? "font-semibold underline text-gray-700"
                  : "hover:text-gray-700 hover:underline transition-colors"
              }
            >
              {link.label}
            </Link>
          </Fragment>
        );
      })}
    </div>
  );
}
