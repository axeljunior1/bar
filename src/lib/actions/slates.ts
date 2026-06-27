"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireBarSession } from "@/lib/auth/require-bar-session";
import { dismissPendingKitchenForSlate } from "@/lib/actions/kitchen";
import { createClient } from "@/lib/supabase/server";
import {
  mapRpcLineToItem,
  type RpcLineMutationPayload,
} from "@/lib/slates/line-mutations";
import type { SlateLineItem } from "@/components/slates/types";
import {
  clientNameSchema,
  lineLineTotalSchema,
  lineQuantitySchema,
  paymentMethodIdSchema,
  productPackagingIdSchema,
  productVariantIdSchema,
  slateIdSchema,
  slateLineIdSchema,
  slateLocationSchema,
  slateNoteSchema,
} from "@/lib/validations/slates";

export type SlateActionResult = {
  success: boolean;
  error?: string;
};

export type SlateLineMutationResult = SlateActionResult & {
  line?: SlateLineItem;
  slateTotal?: number;
  deletedLineId?: string;
  kitchenCreated?: boolean;
};

type SlateFormState = {
  error: string | null;
};

function slateDetailPath(slateId: string) {
  return `/ardoises/${slateId}`;
}

function revalidateSlateListPaths(options?: { kitchen?: boolean }) {
  revalidatePath("/");

  if (options?.kitchen) {
    revalidatePath("/cuisine");
  }
}

function revalidateSlateDetailPaths(slateId: string) {
  revalidatePath(slateDetailPath(slateId));
}

function revalidateSlateCheckoutPaths(slateId: string) {
  revalidateSlateListPaths({ kitchen: true });
  revalidatePath(slateDetailPath(slateId));
  revalidatePath("/ventes");
}

function parseLineMutationPayload(
  data: unknown,
): RpcLineMutationPayload | null {
  if (!data || typeof data !== "object") {
    return null;
  }

  const payload = data as RpcLineMutationPayload;

  if (typeof payload.slate_total !== "number") {
    return null;
  }

  return payload;
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

function mapDbError(error: { message: string }): string {
  if (
    error.message.includes("Ardoise") ||
    error.message.includes("Conditionnement") ||
    error.message.includes("Produit") ||
    error.message.includes("Quantité") ||
    error.message.includes("Prix") ||
    error.message.includes("Variante") ||
    error.message.includes("Ligne") ||
    error.message.includes("Accès")
  ) {
    return error.message;
  }

  if (error.message.includes("paiement")) {
    return error.message;
  }

  return "Une erreur est survenue. Réessayez.";
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
  lineTotal?: number,
  productVariantId?: string | null,
): Promise<SlateLineMutationResult> {
  await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedPackagingId = productPackagingIdSchema.safeParse(productPackagingId);
  const parsedQuantity = lineQuantitySchema.safeParse(quantity);
  const parsedLineTotal =
    lineTotal === undefined
      ? { success: true as const, data: undefined }
      : lineLineTotalSchema.safeParse(lineTotal);
  const parsedVariantId =
    productVariantId === undefined
      ? { success: true as const, data: null }
      : productVariantId === null
        ? { success: true as const, data: null }
        : productVariantIdSchema.safeParse(productVariantId);

  if (
    !parsedSlateId.success ||
    !parsedPackagingId.success ||
    !parsedQuantity.success ||
    !parsedLineTotal.success ||
    !parsedVariantId.success
  ) {
    return { success: false, error: "Données invalides." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("add_slate_line", {
    p_slate_id: parsedSlateId.data,
    p_product_packaging_id: parsedPackagingId.data,
    p_quantity: parsedQuantity.data,
    p_line_total: parsedLineTotal.data ?? null,
    p_product_variant_id: parsedVariantId.data,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  const payload = parseLineMutationPayload(data);

  if (!payload?.line) {
    return { success: false, error: "Réponse serveur invalide." };
  }

  if (payload.kitchen_created) {
    revalidateSlateListPaths({ kitchen: true });
  }

  return {
    success: true,
    line: mapRpcLineToItem(payload.line),
    slateTotal: Number(payload.slate_total),
    kitchenCreated: payload.kitchen_created,
  };
}

export async function updateSlateLineLineTotal(
  slateId: string,
  lineId: string,
  lineTotal: number | null,
): Promise<SlateLineMutationResult> {
  await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedLineId = slateLineIdSchema.safeParse(lineId);
  const parsedLineTotal =
    lineTotal === null
      ? { success: true as const, data: null }
      : lineLineTotalSchema.safeParse(lineTotal);

  if (
    !parsedSlateId.success ||
    !parsedLineId.success ||
    !parsedLineTotal.success
  ) {
    return { success: false, error: "Données invalides." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_slate_line_line_total", {
    p_slate_id: parsedSlateId.data,
    p_line_id: parsedLineId.data,
    p_line_total: parsedLineTotal.data,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  const payload = parseLineMutationPayload(data);

  if (!payload?.line) {
    return { success: false, error: "Réponse serveur invalide." };
  }

  return {
    success: true,
    line: mapRpcLineToItem(payload.line),
    slateTotal: Number(payload.slate_total),
  };
}

export async function updateSlateLineQuantity(
  slateId: string,
  lineId: string,
  quantity: number,
): Promise<SlateLineMutationResult> {
  await requireBarSession();

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

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("update_slate_line_quantity", {
    p_slate_id: parsedSlateId.data,
    p_line_id: parsedLineId.data,
    p_quantity: parsedQuantity.data,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  const payload = parseLineMutationPayload(data);

  if (!payload?.line) {
    return { success: false, error: "Réponse serveur invalide." };
  }

  if (payload.kitchen_created) {
    revalidateSlateListPaths({ kitchen: true });
  }

  return {
    success: true,
    line: mapRpcLineToItem(payload.line),
    slateTotal: Number(payload.slate_total),
    kitchenCreated: payload.kitchen_created,
  };
}

export async function removeSlateLine(
  slateId: string,
  lineId: string,
): Promise<SlateLineMutationResult> {
  await requireBarSession();

  const parsedSlateId = slateIdSchema.safeParse(slateId);
  const parsedLineId = slateLineIdSchema.safeParse(lineId);

  if (!parsedSlateId.success || !parsedLineId.success) {
    return { success: false, error: "Données invalides." };
  }

  const supabase = await createClient();

  const { data, error } = await supabase.rpc("delete_slate_line", {
    p_slate_id: parsedSlateId.data,
    p_line_id: parsedLineId.data,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  const payload = parseLineMutationPayload(data);

  if (!payload?.deleted_line_id) {
    return { success: false, error: "Réponse serveur invalide." };
  }

  return {
    success: true,
    deletedLineId: payload.deleted_line_id,
    slateTotal: Number(payload.slate_total),
  };
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
