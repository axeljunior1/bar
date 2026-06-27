import Link from "next/link";
import { redirect } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { getSessionContext, isOwner } from "@/lib/auth/session";

const settingsLinks = [
  { href: "/parametres/categories", label: "Catégories", icon: "🏷️" },
  { href: "/parametres/conditionnements", label: "Conditionnements", icon: "📦" },
  { href: "/parametres/paiements", label: "Moyens de paiement", icon: "💳" },
  { href: "/parametres/produits", label: "Produits", icon: "🍻" },
];

export default async function ParametresPage() {
  const session = await getSessionContext();

  if (!session || !isOwner(session.profile)) {
    redirect("/");
  }

  return (
    <AppShell title="Réglages">
      <ul className="space-y-3">
        {settingsLinks.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="flex min-h-16 items-center gap-4 rounded-3xl border border-border bg-white px-4 active:bg-surface-muted"
            >
              <span className="text-2xl" aria-hidden>
                {link.icon}
              </span>
              <span className="text-lg font-medium">{link.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
