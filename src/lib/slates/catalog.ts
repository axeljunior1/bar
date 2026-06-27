import { createClient } from "@/lib/supabase/server";
import { computePackagingPrice } from "@/lib/utils/money";
import type {
  PaymentMethodOption,
  SellableCategory,
  SellableProduct,
  SlateLineItem,
} from "@/components/slates/types";

export async function loadSellableCatalog(barId: string) {
  const supabase = await createClient();

  const [
    { data: categories },
    { data: products },
    { data: packagings },
    { data: packagingTypes },
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
  ]);

  const packagingTypeById = new Map(
    packagingTypes?.map((type) => [type.id, type.name]) ?? [],
  );

  const packagingsByProduct = new Map<string, SellableProduct["packagings"]>();

  packagings?.forEach((packaging) => {
    const product = products?.find((item) => item.id === packaging.product_id);
    if (!product) {
      return;
    }

    const typeName = packagingTypeById.get(packaging.packaging_type_id) ?? "—";
    const price = computePackagingPrice(
      Number(product.unit_price),
      Number(packaging.quantity),
      packaging.optional_price === null
        ? null
        : Number(packaging.optional_price),
    );

    const current = packagingsByProduct.get(packaging.product_id) ?? [];
    current.push({
      id: packaging.id,
      typeName,
      quantity: Number(packaging.quantity),
      price,
    });
    packagingsByProduct.set(packaging.product_id, current);
  });

  const sellableProducts: SellableProduct[] =
    products
      ?.filter((product) => (packagingsByProduct.get(product.id)?.length ?? 0) > 0)
      .map((product) => ({
        id: product.id,
        name: product.name,
        categoryId: product.category_id,
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
      "id, product_name, packaging_name, quantity, unit_price, line_total",
    )
    .eq("slate_id", slateId)
    .eq("bar_id", barId)
    .order("created_at", { ascending: true });

  return (
    data?.map((line) => ({
      id: line.id,
      productName: line.product_name,
      packagingName: line.packaging_name,
      quantity: line.quantity,
      unitPrice: Number(line.unit_price),
      lineTotal: Number(line.line_total),
    })) ?? []
  );
}
