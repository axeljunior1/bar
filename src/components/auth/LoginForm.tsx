"use client";

import { useActionState } from "react";

import { signInWithPassword } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type LoginState = {
  success: boolean;
  error?: string;
};

const initialState: LoginState = { success: false };

export function LoginForm() {
  const [state, formAction, pending] = useActionState(
    async (_prev: LoginState, formData: FormData) => {
      const email = String(formData.get("email") ?? "");
      const password = String(formData.get("password") ?? "");

      if (!email || !password) {
        return { success: false, error: "Tous les champs sont requis." };
      }

      return signInWithPassword(email, password);
    },
    initialState,
  );

  return (
    <form action={formAction} className="flex w-full flex-col gap-6">
      <div className="space-y-4">
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <Input
          label="Mot de passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Connexion..." : "Se connecter"}
      </Button>
    </form>
  );
}
