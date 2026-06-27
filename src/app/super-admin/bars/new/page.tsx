import { SuperAdminShell } from "@/components/super-admin/SuperAdminShell";
import { CreateBarForm } from "@/components/super-admin/CreateBarForm";
import { requireSuperAdmin } from "@/lib/auth/super-admin";

export default async function SuperAdminNewBarPage() {
  await requireSuperAdmin();

  return (
    <SuperAdminShell title="Nouveau bar">
      <CreateBarForm />
    </SuperAdminShell>
  );
}
