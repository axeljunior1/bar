"use client";

import Link from "next/link";
import { useActionState } from "react";

import { requestPasswordReset } from "@/lib/actions/auth";
import { forgotPasswordInitialState } from "@/lib/auth/forgot-password-state";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type ForgotPasswordFormProps = {
  initialError?: string | null;
};

export function ForgotPasswordForm({ initialError = null }: ForgotPasswordFormProps) {
  const [state, formAction, pending] = useActionState(
    requestPasswordReset,
    { ...forgotPasswordInitialState, error: initialError },
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <p className="text-sm text-muted">
        Saisissez l&apos;email du compte. Vous recevrez un lien pour choisir un
        nouveau mot de passe.
      </p>

      <Input
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        capitalize={false}
        defaultValue={state.email}
        required
        disabled={pending}
      />

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      {state.message ? (
        <p className="rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          {state.message}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Envoi..." : "Envoyer le lien"}
      </Button>

      <Link
        href="/login"
        className="text-center text-sm font-medium text-brand-600"
      >
        Retour à la connexion
      </Link>
    </form>
  );
}
