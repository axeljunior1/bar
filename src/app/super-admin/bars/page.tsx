import Link from "next/link";

import { BarsListClient } from "@/components/super-admin/BarsListClient";
import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { loadAllBars } from "@/lib/super-admin/queries";
import { Button } from "@/components/ui/Button";

export default async function SuperAdminBarsPage() {
  await requireSuperAdmin();
  const bars = await loadAllBars();

  return (
    <SuperAdminShell
      title="Entreprises / Bars"
      subtitle={`${bars.length} bar${bars.length > 1 ? "s" : ""}`}
    >
      <div className="mb-6">
        <Link href="/super-admin/bars/new">
          <Button>Nouveau bar</Button>
        </Link>
      </div>

      <BarsListClient bars={bars} />
    </SuperAdminShell>
  );
}
