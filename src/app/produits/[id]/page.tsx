import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { EditProductForm } from "@/components/products/EditProductForm";
import { ProductPackagingManager } from "@/components/products/ProductPackagingManager";
import { requireOwnerPage } from "@/lib/auth/require-owner";
import { formatCurrency } from "@/lib/utils/money";
import { createClient } from "@/lib/supabase/server";

type ProductDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProductDetailPage({
  params,
}: ProductDetailPageProps) {
  const { id } = await params;
  const session = await requireOwnerPage();
  const supabase = await createClient();
  const barId = session.profile.bar_id;

  const { data: product } = await supabase
    .from("products")
    .select("id, name, unit_price, actif, category_id, is_kitchen_item")
    .eq("id", id)
    .eq("bar_id", barId)
    .maybeSingle();

  if (!product) {
    notFound();
  }

  const [
    { data: categories },
    { data: packagingTypes },
    { data: packagings },
    { data: category },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name")
      .eq("bar_id", barId)
      .eq("actif", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("packaging_types")
      .select("id, name")
      .eq("bar_id", barId)
      .eq("actif", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("product_packagings")
      .select("id, quantity, optional_price, packaging_type_id")
      .eq("product_id", id)
      .eq("bar_id", barId)
      .eq("actif", true)
      .order("created_at", { ascending: true }),
    supabase
      .from("categories")
      .select("name")
      .eq("id", product.category_id)
      .eq("bar_id", barId)
      .maybeSingle(),
  ]);

  const packagingTypeById = new Map(
    packagingTypes?.map((type) => [type.id, type.name]) ?? [],
  );

  const packagingItems =
    packagings?.map((packaging) => ({
      id: packaging.id,
      packagingTypeId: packaging.packaging_type_id,
      packagingTypeName:
        packagingTypeById.get(packaging.packaging_type_id) ?? "—",
      quantity: Number(packaging.quantity),
      optionalPrice:
        packaging.optional_price === null
          ? null
          : Number(packaging.optional_price),
    })) ?? [];

  return (
    <AppShell
      title={product.name}
      subtitle={category?.name ?? undefined}
    >
      <BackLink href="/produits" label="Produits" />

      {!product.actif ? (
        <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ce produit est inactif et n&apos;apparaît plus dans la liste principale.
        </p>
      ) : null}

      <div className="mb-6 rounded-3xl border border-border bg-white p-4">
        <p className="text-sm text-muted">Prix unitaire</p>
        <p className="text-2xl font-bold text-brand-700">
          {formatCurrency(Number(product.unit_price))}
        </p>
      </div>

      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Informations</h2>
        <EditProductForm
          product={{
            id: product.id,
            name: product.name,
            categoryId: product.category_id,
            unitPrice: Number(product.unit_price),
            actif: product.actif,
            isKitchenItem: product.is_kitchen_item,
          }}
          categories={categories ?? []}
        />
      </div>

      <ProductPackagingManager
        productId={product.id}
        unitPrice={Number(product.unit_price)}
        packagingTypes={packagingTypes ?? []}
        packagings={packagingItems}
      />
    </AppShell>
  );
}
