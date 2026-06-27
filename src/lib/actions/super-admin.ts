"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireSuperAdmin } from "@/lib/auth/super-admin";
import { createAdminClient, hasAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import {
  createBarFormErrorState,
  type CreateBarFormState,
} from "@/lib/super-admin/create-bar-form-state";
import {
  barIdSchema,
  barNameSchema,
  ownerEmailSchema,
  ownerNameSchema,
} from "@/lib/validations/super-admin";

export type SuperAdminActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

const BARS_LIST_PATH = "/super-admin/bars";

function revalidateSuperAdminPaths() {
  revalidatePath(BARS_LIST_PATH);
  revalidatePath("/super-admin");
}

function generateTemporaryPassword(): string {
  return `${randomBytes(12).toString("base64url")}Aa1!`;
}

export async function createBarWithOwner(
  _prev: CreateBarFormState,
  formData: FormData,
): Promise<CreateBarFormState> {
  await requireSuperAdmin();

  const parsedBarName = barNameSchema.safeParse(formData.get("barName"));
  const parsedOwnerEmail = ownerEmailSchema.safeParse(formData.get("ownerEmail"));
  const parsedOwnerName = ownerNameSchema.safeParse(formData.get("ownerName") ?? "");

  if (!parsedBarName.success) {
    return createBarFormErrorState(
      _prev,
      formData,
      parsedBarName.error.issues[0]?.message ?? "Nom du bar invalide.",
    );
  }

  if (!parsedOwnerEmail.success) {
    return createBarFormErrorState(
      _prev,
      formData,
      parsedOwnerEmail.error.issues[0]?.message ?? "Email invalide.",
    );
  }

  if (!parsedOwnerName.success) {
    return createBarFormErrorState(
      _prev,
      formData,
      parsedOwnerName.error.issues[0]?.message ?? "Nom owner invalide.",
    );
  }

  if (!hasAdminClient()) {
    return createBarFormErrorState(
      _prev,
      formData,
      "SUPABASE_SERVICE_ROLE_KEY manquante. Ajoutez-la dans .env.local, puis redémarrez le serveur de dev.",
    );
  }

  const admin = createAdminClient();

  const { data: authUser, error: authError } = await admin.auth.admin.createUser({
    email: parsedOwnerEmail.data,
    password: generateTemporaryPassword(),
    email_confirm: true,
    user_metadata: parsedOwnerName.data
      ? { full_name: parsedOwnerName.data }
      : undefined,
  });

  if (authError || !authUser.user) {
    return createBarFormErrorState(
      _prev,
      formData,
      authError?.message ?? "Impossible de créer le compte owner.",
    );
  }

  const { data: bar, error: barError } = await admin
    .from("bars")
    .insert({
      name: parsedBarName.data,
      status: "active",
      actif: true,
    })
    .select("id")
    .single();

  if (barError || !bar) {
    await admin.auth.admin.deleteUser(authUser.user.id);

    return createBarFormErrorState(
      _prev,
      formData,
      barError?.message ?? "Impossible de créer le bar.",
    );
  }

  const { error: profileError } = await admin.from("profiles").insert({
    id: authUser.user.id,
    bar_id: bar.id,
    role: "owner",
    full_name: parsedOwnerName.data,
    actif: true,
  });

  if (profileError) {
    await admin.from("bars").delete().eq("id", bar.id);
    await admin.auth.admin.deleteUser(authUser.user.id);

    return createBarFormErrorState(
      _prev,
      formData,
      profileError.message ?? "Impossible de créer le profil owner.",
    );
  }

  revalidateSuperAdminPaths();
  redirect(BARS_LIST_PATH);
}

export async function suspendBar(barId: string): Promise<SuperAdminActionResult> {
  await requireSuperAdmin();

  const parsedId = barIdSchema.safeParse(barId);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bars")
    .update({ status: "suspended" })
    .eq("id", parsedId.data)
    .eq("status", "active")
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "Impossible de suspendre le bar." };
  }

  if (!data) {
    return { success: false, error: "Bar introuvable ou déjà suspendu." };
  }

  revalidateSuperAdminPaths();
  return { success: true };
}

export async function reactivateBar(
  barId: string,
): Promise<SuperAdminActionResult> {
  await requireSuperAdmin();

  const parsedId = barIdSchema.safeParse(barId);
  if (!parsedId.success) {
    return { success: false, error: parsedId.error.issues[0]?.message };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bars")
    .update({ status: "active" })
    .eq("id", parsedId.data)
    .eq("status", "suspended")
    .select("id")
    .maybeSingle();

  if (error) {
    return { success: false, error: "Impossible de réactiver le bar." };
  }

  if (!data) {
    return { success: false, error: "Bar introuvable ou déjà actif." };
  }

  revalidateSuperAdminPaths();
  return { success: true };
}
