import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { CreateProductForm } from "@/components/products/CreateProductForm";
import { requireOwnerPage } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const session = await requireOwnerPage();
  const supabase = await createClient();

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .eq("bar_id", session.profile.bar_id)
    .eq("actif", true)
    .order("sort_order", { ascending: true });

  return (
    <AppShell title="Nouveau produit">
      <BackLink href="/produits" label="Produits" />
      <CreateProductForm categories={categories ?? []} />
    </AppShell>
  );
}
