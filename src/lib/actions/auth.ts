"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

import { createClient } from "@/lib/supabase/server";
import type { ForgotPasswordState } from "@/lib/auth/forgot-password-state";
import {
  getAppOrigin,
  getPasswordResetRedirectUrl,
  isLocalhostOrigin,
} from "@/lib/site-url";
import {
  authEmailSchema,
  confirmPasswordSchema,
} from "@/lib/validations/auth";

export type ActionResult = {
  success: boolean;
  error?: string;
  message?: string;
};

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

  let origin: string;

  try {
    origin = await getAppOrigin();
  } catch {
    return {
      error:
        "Configuration manquante : ajoutez NEXT_PUBLIC_SITE_URL sur Netlify (ex. https://votre-app.netlify.app).",
      message: null,
      email: parsedEmail.data,
    };
  }

  if (
    process.env.NODE_ENV === "production" &&
    isLocalhostOrigin(origin)
  ) {
    return {
      error:
        "Configuration incorrecte : NEXT_PUBLIC_SITE_URL ne doit pas pointer vers localhost en production.",
      message: null,
      email: parsedEmail.data,
    };
  }

  const { error } = await supabase.auth.resetPasswordForEmail(parsedEmail.data, {
    redirectTo: getPasswordResetRedirectUrl(origin),
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
