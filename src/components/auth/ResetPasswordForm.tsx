"use client";

import Link from "next/link";
import { useActionState } from "react";

import { updatePassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState = { success: false, error: undefined as string | undefined };

export function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(
    updatePassword,
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <p className="text-sm text-muted">
        Choisissez un nouveau mot de passe pour votre compte.
      </p>

      <Input
        label="Nouveau mot de passe"
        name="password"
        type="password"
        autoComplete="new-password"
        capitalize={false}
        minLength={8}
        required
        disabled={pending}
      />

      <Input
        label="Confirmer le mot de passe"
        name="confirmPassword"
        type="password"
        autoComplete="new-password"
        capitalize={false}
        minLength={8}
        required
        disabled={pending}
      />

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer le mot de passe"}
      </Button>

      <Link
        href="/login/mot-de-passe-oublie"
        className="text-center text-sm font-medium text-brand-600"
      >
        Demander un nouveau lien
      </Link>
    </form>
  );
}
