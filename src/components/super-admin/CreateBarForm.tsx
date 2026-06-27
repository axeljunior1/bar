"use client";

import { useActionState } from "react";

import { createBarWithOwner } from "@/lib/actions/super-admin";
import { createBarInitialState } from "@/lib/super-admin/create-bar-form-state";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function CreateBarForm() {
  const [state, formAction, pending] = useActionState(
    createBarWithOwner,
    createBarInitialState,
  );

  const fields = state.fields ?? createBarInitialState.fields;
  const formKey = state.formKey ?? 0;

  return (
    <form
      key={formKey}
      action={formAction}
      className="flex flex-col gap-4"
    >
      <Input
        label="Nom du bar"
        name="barName"
        defaultValue={fields.barName}
        placeholder="Ex. Le Comptoir"
        required
        autoComplete="off"
        disabled={pending}
      />

      <Input
        label="Email owner"
        name="ownerEmail"
        type="email"
        inputMode="email"
        defaultValue={fields.ownerEmail}
        placeholder="owner@example.com"
        required
        autoComplete="off"
        capitalize={false}
        disabled={pending}
      />

      <Input
        label="Nom owner (optionnel)"
        name="ownerName"
        defaultValue={fields.ownerName}
        placeholder="Ex. Marie Dupont"
        autoComplete="off"
        disabled={pending}
      />

      <p className="rounded-2xl bg-surface-muted px-4 py-3 text-sm text-muted">
        Un compte owner est créé avec un mot de passe temporaire. L&apos;owner
        peut utiliser « Mot de passe oublié » sur la page de connexion pour
        définir son mot de passe.
      </p>

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Créer le bar"}
      </Button>
    </form>
  );
}
