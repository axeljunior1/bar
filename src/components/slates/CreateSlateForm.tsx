"use client";

import { useActionState } from "react";

import { createSlateAction } from "@/lib/actions/slates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const initialState = { error: null as string | null };

export function CreateSlateForm() {
  const [state, formAction, pending] = useActionState(
    createSlateAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nom client / groupe"
        name="clientName"
        placeholder="Ex. Table 5, Jean..."
        required
        autoComplete="off"
        disabled={pending}
      />

      <Input
        label="Emplacement (optionnel)"
        name="location"
        placeholder="Ex. Terrasse, Comptoir..."
        autoComplete="off"
        disabled={pending}
      />

      <Input
        label="Note (optionnel)"
        name="note"
        placeholder="Ex. Terrasse, anniversaire..."
        autoComplete="off"
        capitalize="sentence"
        disabled={pending}
      />

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending}>
        {pending ? "Création..." : "Ouvrir l'ardoise"}
      </Button>
    </form>
  );
}
