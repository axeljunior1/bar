"use client";

import { useActionState } from "react";

import { createProductAction } from "@/lib/actions/products";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export type CategoryOption = {
  id: string;
  name: string;
};

type CreateProductFormProps = {
  categories: CategoryOption[];
};

const initialState = { error: null as string | null };

export function CreateProductForm({ categories }: CreateProductFormProps) {
  const [state, formAction, pending] = useActionState(
    createProductAction,
    initialState,
  );

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <Input
        label="Nom du produit"
        name="name"
        placeholder="Ex. Pression 25cl"
        required
        disabled={pending}
      />

      <Select
        label="Catégorie"
        name="categoryId"
        options={categories.map((category) => ({
          value: category.id,
          label: category.name,
        }))}
        required
        disabled={pending || !categories.length}
      />

      <Input
        label="Prix unitaire (€)"
        name="unitPrice"
        type="number"
        inputMode="decimal"
        step="0.01"
        min="0"
        placeholder="0.00"
        required
        disabled={pending}
      />

      {!categories.length ? (
        <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Créez d&apos;abord une catégorie dans les réglages.
        </p>
      ) : null}

      {state.error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {state.error}
        </p>
      ) : null}

      <Button type="submit" disabled={pending || !categories.length}>
        {pending ? "Création..." : "Créer le produit"}
      </Button>
    </form>
  );
}
