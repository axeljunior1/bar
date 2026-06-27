"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireOwnerAction } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";
import {
  categoryIdSchema,
  optionalPriceSchema,
  packagingIdSchema,
  packagingTypeIdSchema,
  productActiveSchema,
  productKitchenSchema,
  productIdSchema,
  productNameSchema,
  quantitySchema,
  unitPriceSchema,
} from "@/lib/validations/products";

export type ProductActionResult = {
  success: boolean;
  error?: string;
};

type ProductFormState = {
  error: string | null;
};

const PRODUCT_LIST_PATH = "/produits";
const BASE_PACKAGING_TYPE_NAME = "Unité";

function productDetailPath(productId: string) {
  return `/produits/${productId}`;
}

function revalidateProductPaths(productId: string) {
  revalidatePath(PRODUCT_LIST_PATH);
  revalidatePath(productDetailPath(productId));
}

function mapDbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ce conditionnement existe déjà pour ce produit.";
  }

  return "Une erreur est survenue. Réessayez.";
}

async function countActivePackagings(
  productId: string,
  barId: string,
): Promise<number> {
  const supabase = await createClient();

  const { count } = await supabase
    .from("product_packagings")
    .select("*", { count: "exact", head: true })
    .eq("product_id", productId)
    .eq("bar_id", barId)
    .eq("actif", true);

  return count ?? 0;
}

async function ensureProductOwnership(productId: string, barId: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("id")
    .eq("id", productId)
    .eq("bar_id", barId)
    .maybeSingle();

  if (error || !data) {
    return false;
  }

  return true;
}

async function createBaseUnitPackaging(
  productId: string,
  barId: string,
): Promise<ProductActionResult> {
  const supabase = await createClient();

  const { data: unitType } = await supabase
    .from("packaging_types")
    .select("id")
    .eq("bar_id", barId)
    .eq("name", BASE_PACKAGING_TYPE_NAME)
    .eq("actif", true)
    .maybeSingle();

  if (!unitType) {
    return {
      success: false,
      error: `Le conditionnement « ${BASE_PACKAGING_TYPE_NAME} » est introuvable. Vérifiez vos réglages.`,
    };
  }

  const { error } = await supabase.from("product_packagings").insert({
    bar_id: barId,
    product_id: productId,
    packaging_type_id: unitType.id,
    quantity: 1,
    optional_price: null,
    actif: true,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  return { success: true };
}

export async function createProductAction(
  _prev: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { error: auth.error };
  }

  const parsedName = productNameSchema.safeParse(formData.get("name"));
  const parsedCategoryId = categoryIdSchema.safeParse(formData.get("categoryId"));
  const parsedUnitPrice = unitPriceSchema.safeParse(formData.get("unitPrice"));
  const parsedKitchen = productKitchenSchema.safeParse(
    formData.get("isKitchenItem"),
  );

  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Nom invalide." };
  }

  if (!parsedCategoryId.success) {
    return {
      error: parsedCategoryId.error.issues[0]?.message ?? "Catégorie invalide.",
    };
  }

  if (!parsedUnitPrice.success) {
    return {
      error: parsedUnitPrice.error.issues[0]?.message ?? "Prix unitaire invalide.",
    };
  }

  if (!parsedKitchen.success) {
    return { error: "Option cuisine invalide." };
  }

  const supabase = await createClient();
  const barId = auth.session.profile.bar_id;

  const { data: category } = await supabase
    .from("categories")
    .select("id")
    .eq("id", parsedCategoryId.data)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!category) {
    return { error: "Catégorie introuvable." };
  }

  const { data: product, error } = await supabase
    .from("products")
    .insert({
      bar_id: barId,
      category_id: parsedCategoryId.data,
      name: parsedName.data,
      unit_price: parsedUnitPrice.data,
      is_kitchen_item: parsedKitchen.data,
      actif: true,
    })
    .select("id")
    .single();

  if (error || !product) {
    return { error: mapDbError(error ?? { message: "Erreur inconnue" }) };
  }

  const packagingResult = await createBaseUnitPackaging(product.id, barId);

  if (!packagingResult.success) {
    await supabase
      .from("products")
      .update({ actif: false })
      .eq("id", product.id)
      .eq("bar_id", barId);

    return { error: packagingResult.error ?? "Impossible de créer le conditionnement de base." };
  }

  revalidatePath(PRODUCT_LIST_PATH);
  redirect(productDetailPath(product.id));
}

export async function updateProduct(
  productId: string,
  input: {
    name: string;
    categoryId: string;
    unitPrice: number;
    actif: boolean;
    isKitchenItem: boolean;
  },
): Promise<ProductActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedId = productIdSchema.safeParse(productId);
  const parsedName = productNameSchema.safeParse(input.name);
  const parsedCategoryId = categoryIdSchema.safeParse(input.categoryId);
  const parsedUnitPrice = unitPriceSchema.safeParse(input.unitPrice);
  const parsedActif = productActiveSchema.safeParse(input.actif);
  const parsedKitchen = productKitchenSchema.safeParse(input.isKitchenItem);

  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  if (!parsedName.success) {
    return { success: false, error: parsedName.error.issues[0]?.message };
  }

  if (!parsedCategoryId.success) {
    return { success: false, error: parsedCategoryId.error.issues[0]?.message };
  }

  if (!parsedUnitPrice.success) {
    return { success: false, error: parsedUnitPrice.error.issues[0]?.message };
  }

  if (!parsedActif.success) {
    return { success: false, error: "Statut invalide." };
  }

  if (!parsedKitchen.success) {
    return { success: false, error: "Option cuisine invalide." };
  }

  const barId = auth.session.profile.bar_id;
  const owned = await ensureProductOwnership(parsedId.data, barId);

  if (!owned) {
    return { success: false, error: "Produit introuvable." };
  }

  const supabase = await createClient();

  if (parsedActif.data) {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsedCategoryId.data)
      .eq("bar_id", barId)
      .eq("actif", true)
      .maybeSingle();

    if (!category) {
      return { success: false, error: "Catégorie introuvable." };
    }
  } else {
    const { data: category } = await supabase
      .from("categories")
      .select("id")
      .eq("id", parsedCategoryId.data)
      .eq("bar_id", barId)
      .maybeSingle();

    if (!category) {
      return { success: false, error: "Catégorie introuvable." };
    }
  }

  const { error } = await supabase
    .from("products")
    .update({
      name: parsedName.data,
      category_id: parsedCategoryId.data,
      unit_price: parsedUnitPrice.data,
      actif: parsedActif.data,
      is_kitchen_item: parsedKitchen.data,
    })
    .eq("id", parsedId.data)
    .eq("bar_id", barId);

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidateProductPaths(parsedId.data);
  return { success: true };
}

export async function deactivateProduct(
  productId: string,
): Promise<ProductActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedId = productIdSchema.safeParse(productId);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const barId = auth.session.profile.bar_id;
  const owned = await ensureProductOwnership(parsedId.data, barId);

  if (!owned) {
    return { success: false, error: "Produit introuvable." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .update({ actif: false })
    .eq("id", parsedId.data)
    .eq("bar_id", barId)
    .eq("actif", true)
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  if (!data) {
    return { success: false, error: "Produit déjà inactif ou introuvable." };
  }

  revalidateProductPaths(parsedId.data);
  revalidatePath(PRODUCT_LIST_PATH);
  return { success: true };
}

export async function createProductPackaging(input: {
  productId: string;
  packagingTypeId: string;
  quantity: number;
  optionalPrice: number | null;
}): Promise<ProductActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedProductId = productIdSchema.safeParse(input.productId);
  const parsedPackagingTypeId = packagingTypeIdSchema.safeParse(
    input.packagingTypeId,
  );
  const parsedQuantity = quantitySchema.safeParse(input.quantity);
  const parsedOptionalPrice = optionalPriceSchema.safeParse(input.optionalPrice);

  if (!parsedProductId.success) {
    return { success: false, error: parsedProductId.error.issues[0]?.message };
  }

  if (!parsedPackagingTypeId.success) {
    return {
      success: false,
      error: parsedPackagingTypeId.error.issues[0]?.message,
    };
  }

  if (!parsedQuantity.success) {
    return { success: false, error: parsedQuantity.error.issues[0]?.message };
  }

  if (!parsedOptionalPrice.success) {
    return {
      success: false,
      error: parsedOptionalPrice.error.issues[0]?.message,
    };
  }

  const barId = auth.session.profile.bar_id;
  const owned = await ensureProductOwnership(parsedProductId.data, barId);

  if (!owned) {
    return { success: false, error: "Produit introuvable." };
  }

  const supabase = await createClient();

  const { data: packagingType } = await supabase
    .from("packaging_types")
    .select("id")
    .eq("id", parsedPackagingTypeId.data)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!packagingType) {
    return { success: false, error: "Conditionnement introuvable." };
  }

  const { error } = await supabase.from("product_packagings").insert({
    bar_id: barId,
    product_id: parsedProductId.data,
    packaging_type_id: parsedPackagingTypeId.data,
    quantity: parsedQuantity.data,
    optional_price: parsedOptionalPrice.data,
    actif: true,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidateProductPaths(parsedProductId.data);
  return { success: true };
}

export async function updateProductPackaging(input: {
  packagingId: string;
  productId: string;
  packagingTypeId: string;
  quantity: number;
  optionalPrice: number | null;
}): Promise<ProductActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedPackagingId = packagingIdSchema.safeParse(input.packagingId);
  const parsedProductId = productIdSchema.safeParse(input.productId);
  const parsedPackagingTypeId = packagingTypeIdSchema.safeParse(
    input.packagingTypeId,
  );
  const parsedQuantity = quantitySchema.safeParse(input.quantity);
  const parsedOptionalPrice = optionalPriceSchema.safeParse(input.optionalPrice);

  if (
    !parsedPackagingId.success ||
    !parsedProductId.success ||
    !parsedPackagingTypeId.success ||
    !parsedQuantity.success ||
    !parsedOptionalPrice.success
  ) {
    return { success: false, error: "Données invalides." };
  }

  const barId = auth.session.profile.bar_id;
  const owned = await ensureProductOwnership(parsedProductId.data, barId);

  if (!owned) {
    return { success: false, error: "Produit introuvable." };
  }

  const supabase = await createClient();

  const { data: packagingType } = await supabase
    .from("packaging_types")
    .select("id")
    .eq("id", parsedPackagingTypeId.data)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!packagingType) {
    return { success: false, error: "Conditionnement introuvable." };
  }

  const { error } = await supabase
    .from("product_packagings")
    .update({
      packaging_type_id: parsedPackagingTypeId.data,
      quantity: parsedQuantity.data,
      optional_price: parsedOptionalPrice.data,
    })
    .eq("id", parsedPackagingId.data)
    .eq("product_id", parsedProductId.data)
    .eq("bar_id", barId)
    .eq("actif", true);

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidateProductPaths(parsedProductId.data);
  return { success: true };
}

export async function deactivateProductPackaging(input: {
  packagingId: string;
  productId: string;
}): Promise<ProductActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedPackagingId = packagingIdSchema.safeParse(input.packagingId);
  const parsedProductId = productIdSchema.safeParse(input.productId);

  if (!parsedPackagingId.success || !parsedProductId.success) {
    return { success: false, error: "Données invalides." };
  }

  const barId = auth.session.profile.bar_id;
  const owned = await ensureProductOwnership(parsedProductId.data, barId);

  if (!owned) {
    return { success: false, error: "Produit introuvable." };
  }

  const activeCount = await countActivePackagings(parsedProductId.data, barId);

  if (activeCount <= 1) {
    return {
      success: false,
      error:
        "Le produit doit conserver au moins un conditionnement actif pour être vendable.",
    };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("product_packagings")
    .update({ actif: false })
    .eq("id", parsedPackagingId.data)
    .eq("product_id", parsedProductId.data)
    .eq("bar_id", barId)
    .eq("actif", true);

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidateProductPaths(parsedProductId.data);
  return { success: true };
}
