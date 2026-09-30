"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/admin", label: "Dashboard", match: (p: string) => p === "/admin" },
  { href: "/admin/stories", label: "Stories", match: (p: string) => p.startsWith("/admin/stories") },
  { href: "/admin/analytics", label: "Analytics", match: (p: string) => p.startsWith("/admin/analytics") },
  { href: "/admin/essentials-index", label: "Essentials Index", match: (p: string) => p.startsWith("/admin/essentials-index") },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav className="flex flex-row flex-wrap gap-1 md:flex-col">
      {NAV.map((n) => {
        const active = n.match(pathname);
        return (
          <Link
            key={n.href}
            href={n.href}
            aria-current={active ? "page" : undefined}
            className={`px-2.5 py-[11px] font-cond text-[15px] leading-none font-medium tracking-[.02em] text-paper ${active ? "bg-accent" : "hover:bg-ink-2"}`}
          >
            {n.label}
          </Link>
        );
      })}
      <Link href="/" target="_blank" className="px-2.5 py-[11px] font-cond text-[15px] leading-none text-faint hover:bg-ink-2 hover:text-paper">
        View site ↗
      </Link>
    </nav>
  );
}
