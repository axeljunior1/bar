"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireBarSession } from "@/lib/auth/require-bar-session";
import { dismissPendingKitchenForSlate } from "@/lib/actions/kitchen";
import { createClient } from "@/lib/supabase/server";
import { computePackagingPrice } from "@/lib/utils/money";
import {
  clientNameSchema,
  lineQuantitySchema,
  paymentMethodIdSchema,
  productPackagingIdSchema,
  slateIdSchema,
  slateLineIdSchema,
  slateLocationSchema,
  slateNoteSchema,
} from "@/lib/validations/slates";

export type SlateActionResult = {
  success: boolean;
  error?: string;
};

type SlateFormState = {
  error: string | null;
};

function slateDetailPath(slateId: string) {
  return `/ardoises/${slateId}`;
}

function revalidateSlateDetailPaths(
  slateId: string,
  options?: { kitchen?: boolean },
) {
  revalidatePath("/");
  revalidatePath(slateDetailPath(slateId));

  if (options?.kitchen) {
    revalidatePath("/cuisine");
  }
}

function revalidateSlateCheckoutPaths(slateId: string) {
  revalidateSlateDetailPaths(slateId, { kitchen: true });
  revalidatePath("/ventes");
}

type OpenSlate = {
  id: string;
  status: string;
  total: number;
  client_name: string;
  note: string | null;
  location: string | null;
};

async function getOpenSlate(
  slateId: string,
  barId: string,
): Promise<OpenSlate | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("slates")
    .select("id, status, total, client_name, note, location")
    .eq("id", slateId)
    .eq("bar_id", barId)
    .eq("status", "open")
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  return data;
}

async function createKitchenItemForLine(params: {
  barId: string;
  slate: OpenSlate;
  slateLineId: string;
  productName: string;
  packagingName: string;
  quantity: number;
}) {
  const supabase = await createClient();

  await supabase.from("kitchen_items").insert({
    bar_id: params.barId,
    slate_id: params.slate.id,
    slate_line_id: params.slateLineId,
    client_name_snapshot: params.slate.client_name,
    location_snapshot: params.slate.location,
    note_snapshot: params.slate.note,
    product_name_snapshot: params.productName,
    packaging_name_snapshot: params.packagingName,
    quantity: params.quantity,
    status: "pending",
  });
}

function mapDbError(error: { message: string }): string {
  if (error.message.includes("Ardoise")) {
    return error.message;
  }

  if (error.message.includes("paiement")) {
    return error.message;
  }

  return "Une erreur est survenue. Réessayez.";
}

async function recalculateSlateTotal(slateId: string, barId: string) {
  const supabase = await createClient();

  const { data: lines } = await supabase
    .from("slate_lines")
    .select("line_total")
    .eq("slate_id", slateId)
    .eq("bar_id", barId);

  const total =
    lines?.reduce((sum, line) => sum + Number(line.line_total), 0) ?? 0;

  await supabase
    .from("slates")
    .update({ total })
    .eq("id", slateId)
    .eq("bar_id", barId)
    .eq("status", "open");
}

export async function createSlateAction(
  _prev: SlateFormState,
  formData: FormData,
): Promise<SlateFormState> {
  const session = await requireBarSession();

  const parsedName = clientNameSchema.safeParse(formData.get("clientName"));
  const parsedNote = slateNoteSchema.safeParse(formData.get("note") ?? "");
  const parsedLocation = slateLocationSchema.safeParse(
    formData.get("location") ?? "",
  );

  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Nom invalide." };
  }

  if (!parsedNote.success) {
    return { error: parsedNote.error.issues[0]?.message ?? "Note invalide." };
  }

  if (!parsedLocation.success) {
    return {
      error: parsedLocation.error.issues[0]?.message ?? "Emplacement invalide.",
    };
  }

  const supabase = await createClient();

  const { data: slate, error } = await supabase
    .from("slates")
    .insert({
      bar_id: session.profile.bar_id,
      client_name: parsedName.data,
      location: parsedLocation.data,
      note: parsedNote.data,
      status: "open",
      total: 0,
      created_by: session.userId,
    })
    .select("id")
    .single();

  if (error || !slate) {
    return { error: "Impossible de créer l'ardoise." };
  }

  revalidatePath("/");
  redirect(slateDetailPath(slate.id));
}

export async function updateSlateAction(
  slateId: string,
  _prev: SlateFormState,
  formData: FormData,
): Promise<SlateFormState> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedName = clientNameSchema.safeParse(formData.get("clientName"));
  const parsedNote = slateNoteSchema.safeParse(formData.get("note") ?? "");
  const parsedLocation = slateLocationSchema.safeParse(
    formData.get("location") ?? "",
  );

  if (!parsedSlateId.success) {
    return { error: parsedSlateId.error.issues[0]?.message ?? "Ardoise invalide." };
  }

  if (!parsedName.success) {
    return { error: parsedName.error.issues[0]?.message ?? "Nom invalide." };
  }

  if (!parsedNote.success) {
    return { error: parsedNote.error.issues[0]?.message ?? "Note invalide." };
  }

  if (!parsedLocation.success) {
    return {
      error: parsedLocation.error.issues[0]?.message ?? "Emplacement invalide.",
    };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { error: "Ardoise introuvable ou clôturée." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("slates")
    .update({
      client_name: parsedName.data,
      location: parsedLocation.data,
      note: parsedNote.data,
    })
    .eq("id", parsedSlateId.data)
    .eq("bar_id", barId)
    .eq("status", "open");

  if (error) {
    return { error: "Impossible de mettre à jour l'ardoise." };
  }

  revalidateSlateDetailPaths(parsedSlateId.data);
  return { error: null };
}

export async function addSlateLine(
  slateId: string,
  productPackagingId: string,
  quantity = 1,
): Promise<SlateActionResult> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedPackagingId = productPackagingIdSchema.safeParse(productPackagingId);
  const parsedQuantity = lineQuantitySchema.safeParse(quantity);

  if (
    !parsedSlateId.success ||
    !parsedPackagingId.success ||
    !parsedQuantity.success
  ) {
    return { success: false, error: "Données invalides." };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { success: false, error: "Ardoise introuvable ou clôturée." };
  }

  const supabase = await createClient();

  const { data: packaging } = await supabase
    .from("product_packagings")
    .select("id, product_id, packaging_type_id, quantity, optional_price, actif")
    .eq("id", parsedPackagingId.data)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!packaging) {
    return { success: false, error: "Conditionnement introuvable." };
  }

  const { data: product } = await supabase
    .from("products")
    .select("id, name, unit_price, actif, is_kitchen_item")
    .eq("id", packaging.product_id)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!product) {
    return { success: false, error: "Produit non vendable." };
  }

  const { data: packagingType } = await supabase
    .from("packaging_types")
    .select("name")
    .eq("id", packaging.packaging_type_id)
    .eq("bar_id", barId)
    .eq("actif", true)
    .maybeSingle();

  if (!packagingType) {
    return { success: false, error: "Type de conditionnement introuvable." };
  }

  const unitPrice = computePackagingPrice(
    Number(product.unit_price),
    Number(packaging.quantity),
    packaging.optional_price === null ? null : Number(packaging.optional_price),
  );

  const { data: existingLine } = await supabase
    .from("slate_lines")
    .select("id, quantity, unit_price")
    .eq("slate_id", parsedSlateId.data)
    .eq("bar_id", barId)
    .eq("product_packaging_id", parsedPackagingId.data)
    .maybeSingle();

  let slateLineId: string;

  if (existingLine) {
    const nextQuantity = existingLine.quantity + parsedQuantity.data;
    const lineTotal = Number(existingLine.unit_price) * nextQuantity;

    const { error } = await supabase
      .from("slate_lines")
      .update({
        quantity: nextQuantity,
        line_total: lineTotal,
      })
      .eq("id", existingLine.id)
      .eq("bar_id", barId);

    if (error) {
      return { success: false, error: "Impossible de mettre à jour la ligne." };
    }

    slateLineId = existingLine.id;
  } else {
    const lineTotal = unitPrice * parsedQuantity.data;

    const { data: insertedLine, error } = await supabase
      .from("slate_lines")
      .insert({
        bar_id: barId,
        slate_id: parsedSlateId.data,
        product_id: product.id,
        product_packaging_id: packaging.id,
        product_name: product.name,
        packaging_name: packagingType.name,
        quantity: parsedQuantity.data,
        unit_price: unitPrice,
        line_total: lineTotal,
      })
      .select("id")
      .single();

    if (error || !insertedLine) {
      return { success: false, error: "Impossible d'ajouter la consommation." };
    }

    slateLineId = insertedLine.id;
  }

  if (product.is_kitchen_item) {
    await createKitchenItemForLine({
      barId,
      slate,
      slateLineId,
      productName: product.name,
      packagingName: packagingType.name,
      quantity: parsedQuantity.data,
    });
  }

  await recalculateSlateTotal(parsedSlateId.data, barId);
  revalidateSlateDetailPaths(parsedSlateId.data, {
    kitchen: product.is_kitchen_item,
  });
  return { success: true };
}

export async function updateSlateLineQuantity(
  slateId: string,
  lineId: string,
  quantity: number,
): Promise<SlateActionResult> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedLineId = slateLineIdSchema.safeParse(lineId);
  const parsedQuantity = lineQuantitySchema.safeParse(quantity);

  if (
    !parsedSlateId.success ||
    !parsedLineId.success ||
    !parsedQuantity.success
  ) {
    return { success: false, error: "Données invalides." };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { success: false, error: "Ardoise introuvable ou clôturée." };
  }

  const supabase = await createClient();

  const { data: line } = await supabase
    .from("slate_lines")
    .select(
      "id, quantity, unit_price, product_id, product_name, packaging_name",
    )
    .eq("id", parsedLineId.data)
    .eq("slate_id", parsedSlateId.data)
    .eq("bar_id", barId)
    .maybeSingle();

  if (!line) {
    return { success: false, error: "Ligne introuvable." };
  }

  const previousQuantity = line.quantity;

  if (previousQuantity === parsedQuantity.data) {
    return { success: true };
  }

  const lineTotal = Number(line.unit_price) * parsedQuantity.data;

  const { error } = await supabase
    .from("slate_lines")
    .update({
      quantity: parsedQuantity.data,
      line_total: lineTotal,
    })
    .eq("id", parsedLineId.data)
    .eq("slate_id", parsedSlateId.data)
    .eq("bar_id", barId);

  if (error) {
    return { success: false, error: "Impossible de modifier la quantité." };
  }

  let kitchenUpdated = false;

  if (parsedQuantity.data > previousQuantity) {
    const { data: product } = await supabase
      .from("products")
      .select("is_kitchen_item")
      .eq("id", line.product_id)
      .eq("bar_id", barId)
      .maybeSingle();

    if (product?.is_kitchen_item) {
      kitchenUpdated = true;
      await createKitchenItemForLine({
        barId,
        slate,
        slateLineId: line.id,
        productName: line.product_name,
        packagingName: line.packaging_name,
        quantity: parsedQuantity.data - previousQuantity,
      });
    }
  }

  await recalculateSlateTotal(parsedSlateId.data, barId);
  revalidateSlateDetailPaths(parsedSlateId.data, { kitchen: kitchenUpdated });
  return { success: true };
}

export async function removeSlateLine(
  slateId: string,
  lineId: string,
): Promise<SlateActionResult> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedLineId = slateLineIdSchema.safeParse(lineId);

  if (!parsedSlateId.success || !parsedLineId.success) {
    return { success: false, error: "Données invalides." };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { success: false, error: "Ardoise introuvable ou clôturée." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("slate_lines")
    .delete()
    .eq("id", parsedLineId.data)
    .eq("slate_id", parsedSlateId.data)
    .eq("bar_id", barId);

  if (error) {
    return { success: false, error: "Impossible de supprimer la ligne." };
  }

  await recalculateSlateTotal(parsedSlateId.data, barId);
  revalidateSlateDetailPaths(parsedSlateId.data);
  return { success: true };
}

export async function cancelSlate(slateId: string): Promise<SlateActionResult> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  if (!parsedSlateId.success) {
    return { success: false, error: parsedSlateId.error.issues[0]?.message };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { success: false, error: "Ardoise introuvable ou déjà clôturée." };
  }

  const supabase = await createClient();

  const { error } = await supabase
    .from("slates")
    .update({
      status: "cancelled",
      closed_at: new Date().toISOString(),
    })
    .eq("id", parsedSlateId.data)
    .eq("bar_id", barId)
    .eq("status", "open");

  if (error) {
    return { success: false, error: "Impossible d'annuler l'ardoise." };
  }

  await dismissPendingKitchenForSlate(parsedSlateId.data, barId);
  revalidateSlateCheckoutPaths(parsedSlateId.data);
  return { success: true };
}

export async function checkoutSlate(
  slateId: string,
  paymentMethodId: string,
): Promise<SlateActionResult & { saleId?: string }> {
  const session = await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedPaymentMethodId = paymentMethodIdSchema.safeParse(paymentMethodId);

  if (!parsedSlateId.success || !parsedPaymentMethodId.success) {
    return { success: false, error: "Données invalides." };
  }

  const barId = session.profile.bar_id;
  const slate = await getOpenSlate(parsedSlateId.data, barId);

  if (!slate) {
    return { success: false, error: "Ardoise introuvable ou déjà clôturée." };
  }

  if (Number(slate.total) <= 0) {
    return { success: false, error: "Ajoutez au moins une consommation." };
  }

  const supabase = await createClient();

  const { data: saleId, error } = await supabase.rpc("checkout_slate", {
    p_slate_id: parsedSlateId.data,
    p_payment_method_id: parsedPaymentMethodId.data,
    p_created_by: session.userId,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  await dismissPendingKitchenForSlate(parsedSlateId.data, barId);
  revalidateSlateCheckoutPaths(parsedSlateId.data);
  return { success: true, saleId: saleId as string };
}
