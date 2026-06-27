"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ForgotPasswordState } from "@/lib/auth/forgot-password-state";
import {
  authEmailSchema,
  confirmPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

function getSiteOrigin(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }

  return "http://localhost:3000";
}

async function getRequestOrigin(): Promise<string> {
  const headersList = await headers();
  const origin = headersList.get("origin");

  if (origin) {
    return origin.replace(/\/$/, "");
  }

  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol = headersList.get("x-forwarded-proto") ?? "http";

  if (host) {
    return `${protocol}://${host}`;
  }

  return getSiteOrigin();
}

export async function signInWithPassword(
  email: string,
  password: string,
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { success: false, error: "Identifiants invalides." };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function requestPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const email = String(formData.get("email") ?? "");
  const parsedEmail = authEmailSchema.safeParse(email);

  if (!parsedEmail.success) {
    return {
      error: parsedEmail.error.issues[0]?.message ?? "Email invalide.",
      message: null,
      email,
    };
  }

  const supabase = await createClient();
  const origin = await getRequestOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
    redirectTo: `${origin}/auth/callback?next=/login/nouveau-mot-de-passe`,
  });

  if (error) {
    return {
      error: "Impossible d'envoyer l'email. Réessayez plus tard.",
      message: null,
      email: parsedEmail.data,
    };
  }

  return {
    error: null,
    message:
      "Si un compte existe avec cet email, un lien de réinitialisation vient d'être envoyé.",
    email: parsedEmail.data,
  };
}

export async function updatePassword(
  _prev: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const parsedPasswords = confirmPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsedPasswords.success) {
    return {
      success: false,
      error: parsedPasswords.error.issues[0]?.message ?? "Mot de passe invalide.",
    };
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return {
      success: false,
      error: "Session expirée. Demandez un nouveau lien de réinitialisation.",
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsedPasswords.data.password,
  });

  if (error) {
    return {
      success: false,
      error: "Impossible de mettre à jour le mot de passe.",
    };
  }

  revalidatePath("/", "layout");
  redirect("/");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  revalidatePath("/", "layout");
  redirect("/login");
}
