import { createClient } from "@/lib/supabase/server";
import { getPackagingSellPrice } from "@/lib/products/pricing";
import type {
  PaymentMethodOption,
  SellableCategory,
  SellableProduct,
  SellableVariant,
  SlateLineItem,
} from "@/components/slates/types";

export async function loadSellableCatalog(barId: string) {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: products },
    { data: packagings },
    { data: packagingTypes },
    { data: variants },
  ] = await Promise.all([
    supabase
      .from("categories")
      .select("id, name, sort_order")
      .eq("bar_id", barId)
      .eq("actif", true)
      .order("sort_order", { ascending: true }),
    supabase
      .from("products")
      .select("id, name, category_id, unit_price")
      .eq("bar_id", barId)
      .eq("actif", true)
      .order("name", { ascending: true }),
    supabase
      .from("product_packagings")
      .select("id, product_id, packaging_type_id, quantity, optional_price")
      .eq("bar_id", barId)
      .eq("actif", true),
    supabase
      .from("packaging_types")
      .select("id, name")
      .eq("bar_id", barId)
      .eq("actif", true),
    supabase
      .from("product_variants")
      .select("id, product_id, size, color, unit_price, sort_order, actif")
      .eq("bar_id", barId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);

  const packagingTypeById = new Map(
    packagingTypes?.map((type) => [type.id, type.name]) ?? [],
  );

  const variantsByProduct = new Map<string, SellableVariant[]>();
  const productsWithVariants = new Set<string>();

  variants?.forEach((variant) => {
    productsWithVariants.add(variant.product_id);

    if (!variant.actif) {
      return;
    }

    const current = variantsByProduct.get(variant.product_id) ?? [];
    current.push({
      id: variant.id,
      size: variant.size,
      color: variant.color,
      unitPrice:
        variant.unit_price === null ? null : Number(variant.unit_price),
    });
    variantsByProduct.set(variant.product_id, current);
  });

  const packagingsByProduct = new Map<string, SellableProduct["packagings"]>();

  packagings?.forEach((packaging) => {
    const product = products?.find((item) => item.id === packaging.product_id);
    if (!product) {
      return;
    }

    const current = packagingsByProduct.get(packaging.product_id) ?? [];
    current.push({
      id: packaging.id,
      typeName: packagingTypeById.get(packaging.packaging_type_id) ?? "—",
      quantity: Number(packaging.quantity),
      optionalPrice:
        packaging.optional_price === null
          ? null
          : Number(packaging.optional_price),
    });
    packagingsByProduct.set(packaging.product_id, current);
  });

  const sellableProducts: SellableProduct[] =
    products
      ?.filter((product) => {
        const productPackagings = packagingsByProduct.get(product.id) ?? [];
        if (!productPackagings.length) {
          return false;
        }

        if (productsWithVariants.has(product.id)) {
          return (variantsByProduct.get(product.id)?.length ?? 0) > 0;
        }

        return true;
      })
      .map((product) => ({
        id: product.id,
        name: product.name,
        categoryId: product.category_id,
        unitPrice: Number(product.unit_price),
        variants: variantsByProduct.get(product.id) ?? [],
        packagings: packagingsByProduct.get(product.id) ?? [],
      })) ?? [];

  const sellableCategoryIds = new Set(
    sellableProducts.map((product) => product.categoryId),
  );

  const sellableCategories: SellableCategory[] =
    categories
      ?.filter((category) => sellableCategoryIds.has(category.id))
      .map((category) => ({
        id: category.id,
        name: category.name,
      })) ?? [];

  return {
    categories: sellableCategories,
    products: sellableProducts,
  };
}

export async function loadPaymentMethods(
  barId: string,
): Promise<PaymentMethodOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("payment_methods")
    .select("id, name")
    .eq("bar_id", barId)
    .eq("actif", true)
    .order("sort_order", { ascending: true });

  return data ?? [];
}

export async function loadSlateLines(
  slateId: string,
  barId: string,
): Promise<SlateLineItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("slate_lines")
    .select(
      "id, product_packaging_id, product_variant_id, product_name, variant_size_snapshot, variant_color_snapshot, packaging_name, quantity, unit_price, line_total",
    )
    .eq("slate_id", slateId)
    .eq("bar_id", barId)
    .order("created_at", { ascending: true });

  return (
    data?.map((line) => ({
      id: line.id,
      productPackagingId: line.product_packaging_id,
      productVariantId: line.product_variant_id,
      productName: line.product_name,
      variantSize: line.variant_size_snapshot,
      variantColor: line.variant_color_snapshot,
      packagingName: line.packaging_name,
      quantity: line.quantity,
      unitPrice: Number(line.unit_price),
      lineTotal: Number(line.line_total),
    })) ?? []
  );
}

export { getPackagingSellPrice };
