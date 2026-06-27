"use server";

import { revalidatePath } from "next/cache";

import { requireOwnerAction } from "@/lib/auth/require-owner";
import { createClient } from "@/lib/supabase/server";
import { settingsIdSchema, settingsNameSchema } from "@/lib/validations/settings";

export type SettingsActionResult = {
  success: boolean;
  error?: string;
};

type SettingsTable = "categories" | "packaging_types" | "payment_methods";

const REVALIDATE_PATHS: Record<SettingsTable, string> = {
  categories: "/parametres/categories",
  packaging_types: "/parametres/conditionnements",
  payment_methods: "/parametres/paiements",
};

function mapDbError(error: { code?: string; message: string }): string {
  if (error.code === "23505") {
    return "Ce nom existe déjà.";
  }

  return "Une erreur est survenue. Réessayez.";
}

async function getNextSortOrder(
  table: SettingsTable,
  barId: string,
): Promise<number> {
  const supabase = await createClient();

  const { data } = await supabase
    .from(table)
    .select("sort_order")
    .eq("bar_id", barId)
    .eq("actif", true)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (data?.sort_order ?? 0) + 1;
}

async function createSettingsItem(
  table: SettingsTable,
  name: string,
): Promise<SettingsActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedName = settingsNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { success: false, error: parsedName.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const barId = auth.session.profile.bar_id;
  const sortOrder = await getNextSortOrder(table, barId);

  const { error } = await supabase.from(table).insert({
    bar_id: barId,
    name: parsedName.data,
    sort_order: sortOrder,
    actif: true,
  });

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidatePath(REVALIDATE_PATHS[table]);
  return { success: true };
}

async function renameSettingsItem(
  table: SettingsTable,
  id: string,
  name: string,
): Promise<SettingsActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedId = settingsIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const parsedName = settingsNameSchema.safeParse(name);
  if (!parsedName.success) {
    return { success: false, error: parsedName.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ name: parsedName.data })
    .eq("id", parsedId.data)
    .eq("bar_id", auth.session.profile.bar_id)
    .eq("actif", true);

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidatePath(REVALIDATE_PATHS[table]);
  return { success: true };
}

async function deactivateSettingsItem(
  table: SettingsTable,
  id: string,
): Promise<SettingsActionResult> {
  const auth = await requireOwnerAction();
  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  const parsedId = settingsIdSchema.safeParse(id);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from(table)
    .update({ actif: false })
    .eq("id", parsedId.data)
    .eq("bar_id", auth.session.profile.bar_id)
    .eq("actif", true);

  if (error) {
    return { success: false, error: mapDbError(error) };
  }

  revalidatePath(REVALIDATE_PATHS[table]);
  return { success: true };
}

export async function createCategory(
  name: string,
): Promise<SettingsActionResult> {
  return createSettingsItem("categories", name);
}

export async function renameCategory(
  id: string,
  name: string,
): Promise<SettingsActionResult> {
  return renameSettingsItem("categories", id, name);
}

export async function deactivateCategory(
  id: string,
): Promise<SettingsActionResult> {
  return deactivateSettingsItem("categories", id);
}

export async function createPackagingType(
  name: string,
): Promise<SettingsActionResult> {
  return createSettingsItem("packaging_types", name);
}

export async function renamePackagingType(
  id: string,
  name: string,
): Promise<SettingsActionResult> {
  return renameSettingsItem("packaging_types", id, name);
}

export async function deactivatePackagingType(
  id: string,
): Promise<SettingsActionResult> {
  return deactivateSettingsItem("packaging_types", id);
}

export async function createPaymentMethod(
  name: string,
): Promise<SettingsActionResult> {
  return createSettingsItem("payment_methods", name);
}

export async function renamePaymentMethod(
  id: string,
  name: string,
): Promise<SettingsActionResult> {
  return renameSettingsItem("payment_methods", id, name);
}

export async function deactivatePaymentMethod(
  id: string,
): Promise<SettingsActionResult> {
  return deactivateSettingsItem("payment_methods", id);
}
