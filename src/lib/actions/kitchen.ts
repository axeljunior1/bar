"use server";

import { revalidatePath } from "next/cache";

import { requireBarSession } from "@/lib/auth/require-bar-session";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

export type KitchenActionResult = {
  success: boolean;
  error?: string;
};

const kitchenItemIdSchema = z.string().uuid("Commande cuisine invalide.");

function revalidateKitchenPaths() {
  revalidatePath("/cuisine");
}

export async function markKitchenItemServed(
  kitchenItemId: string,
): Promise<KitchenActionResult> {
  const session = await requireBarSession();

  const parsedId = kitchenItemIdSchema.safeParse(kitchenItemId);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const barId = session.profile.bar_id;

  const { data, error } = await supabase
    .from("kitchen_items")
    .update({
      status: "served",
      served_at: new Date().toISOString(),
    })
    .eq("id", parsedId.data)
    .eq("bar_id", barId)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "Impossible de marquer comme servi." };
  }

  if (!data) {
    return { success: false, error: "Commande introuvable ou déjà servie." };
  }

  revalidateKitchenPaths();
  return { success: true };
}

export async function dismissPendingKitchenForSlate(
  slateId: string,
  barId: string,
): Promise<void> {
  const supabase = await createClient();

  await supabase
    .from("kitchen_items")
    .update({
      status: "served",
      served_at: new Date().toISOString(),
    })
    .eq("slate_id", slateId)
    .eq("bar_id", barId)
    .eq("status", "pending");
}
