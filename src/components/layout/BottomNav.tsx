"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils/cn";

type NavItem = {
  href: string;
  label: string;
  icon: string;
  ownerOnly?: boolean;
};

const navItems: NavItem[] = [
  { href: "/", label: "Ardoises", icon: "📋" },
  { href: "/produits", label: "Produits", icon: "🍻", ownerOnly: true },
  { href: "/historique", label: "Historique", icon: "🧾" },
  { href: "/parametres", label: "Réglages", icon: "⚙️", ownerOnly: true },
];

type BottomNavProps = {
  isOwner: boolean;
};

export function BottomNav({ isOwner }: BottomNavProps) {
  const pathname = usePathname();
  const items = navItems.filter((item) => !item.ownerOnly || isOwner);

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-white pb-safe">
      <ul className="mx-auto flex max-w-lg items-stretch justify-around px-2 py-2">
        {items.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 rounded-xl text-xs font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-muted active:bg-surface-muted",
                )}
              >
                <span className="text-xl" aria-hidden>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
