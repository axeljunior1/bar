import { AppShell } from "@/components/layout/AppShell";
import { ProductListClient } from "@/components/products/ProductListClient";
import { requireOwnerPage } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";

export default async function ProduitsPage() {
  const session = await requireOwnerPage();
  const supabase = await createClient();
  const barId = session.profile.bar_id;

  const [{ data: products }, { data: categories }, { data: packagings }] =
    await Promise.all([
      supabase
        .from("products")
        .select("id, name, unit_price, category_id, is_kitchen_item")
        .eq("bar_id", barId)
        .eq("actif", true)
        .order("name", { ascending: true }),
      supabase
        .from("categories")
        .select("id, name")
        .eq("bar_id", barId)
        .eq("actif", true),
      supabase
        .from("product_packagings")
        .select("product_id")
        .eq("bar_id", barId)
        .eq("actif", true),
    ]);

  const categoryById = new Map(
    categories?.map((category) => [category.id, category.name]) ?? [],
  );

  const packagingCountByProduct = new Map<string, number>();
  packagings?.forEach((packaging) => {
    packagingCountByProduct.set(
      packaging.product_id,
      (packagingCountByProduct.get(packaging.product_id) ?? 0) + 1,
    );
  });

  const productItems =
    products?.map((product) => ({
      id: product.id,
      name: product.name,
      categoryName: categoryById.get(product.category_id) ?? "—",
      unitPrice: Number(product.unit_price),
      packagingCount: packagingCountByProduct.get(product.id) ?? 0,
      isKitchenItem: product.is_kitchen_item,
    })) ?? [];

  return (
    <AppShell title="Produits">
      <ProductListClient products={productItems} />
    </AppShell>
  );
}
