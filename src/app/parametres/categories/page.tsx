import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { SettingsListClient } from "@/components/settings/SettingsListClient";
import { requireOwnerPage } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export default async function CategoriesPage() {
  const session = await requireOwnerPage();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("bar_id", session.profile.bar_id)
    .eq("actif", true)
    .order("sort_order", { ascending: true });

  return (
    <AppShell session={session} title="Catégories">
      <BackLink href="/parametres" label="Réglages" />
      <SettingsListClient entity="categories" items={categories ?? []} />
    </AppShell>
  );
}
