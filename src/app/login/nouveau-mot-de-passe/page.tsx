import { redirect } from "next/navigation";

import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login/mot-de-passe-oublie?error=lien");
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-2xl text-white">
          🔒
        </div>
        <h1 className="text-2xl font-bold text-foreground">Nouveau mot de passe</h1>
        <p className="mt-2 text-muted">Dernière étape de la réinitialisation</p>
      </div>
      <ResetPasswordForm />
    </div>
  );
}
