import Link from "next/link";

import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { Button } from "@/components/ui/Button";

export default async function SuperAdminHomePage() {
  await requireSuperAdmin();

  return (
    <SuperAdminShell title="Super Admin">
      <p className="mb-6 text-muted">
        Gestion globale des établissements BarManager.
      </p>

      <Link href="/super-admin/bars">
        <Button size="lg">Entreprises / Bars</Button>
      </Link>
    </SuperAdminShell>
  );
}
