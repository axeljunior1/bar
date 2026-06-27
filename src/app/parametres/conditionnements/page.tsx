import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { SettingsListClient } from "@/components/settings/SettingsListClient";
import { requireOwnerPage } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export default async function ConditionnementsPage() {
  const session = await requireOwnerPage();
  const supabase = await createClient();

  const { data: packagingTypes } = await supabase
    .from("packaging_types")
    .select("id, name")
    .eq("bar_id", session.profile.bar_id)
    .eq("actif", true)
    .order("sort_order", { ascending: true });

  return (
    <AppShell title="Conditionnements">
      <BackLink href="/parametres" label="Réglages" />
      <SettingsListClient entity="packaging_types" items={packagingTypes ?? []} />
    </AppShell>
  );
}
