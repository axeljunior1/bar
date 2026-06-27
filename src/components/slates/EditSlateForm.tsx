"use client";

import { useActionState } from "react";

import { updateSlateAction } from "@/lib/actions/slates";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type EditSlateFormProps = {
  slateId: string;
  clientName: string;
  location: string | null;
  note: string | null;
};

const initialState = { error: null as string | null };

export function EditSlateForm({
  slateId,
  clientName,
  location,
  note,
}: EditSlateFormProps) {
  const boundAction = updateSlateAction.bind(null, slateId);
  const [state, formAction, pending] = useActionState(
    boundAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nom client / groupe"
        name="clientName"
        defaultValue={clientName}
        required
        autoComplete="off"
        disabled={pending}
      />

      <Input
        label="Emplacement (optionnel)"
        name="location"
        defaultValue={location ?? ""}
        placeholder="Ex. Terrasse, Comptoir..."
        autoComplete="off"
        disabled={pending}
      />

      <Input
        label="Note (optionnel)"
        name="note"
        defaultValue={note ?? ""}
        placeholder="Ex. Allergies, anniversaire..."
        autoComplete="off"
        capitalize="sentence"
        disabled={pending}
      />

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" variant="secondary" disabled={pending}>
        {pending ? "Enregistrement..." : "Enregistrer"}
      </Button>
    </form>
  );
}
