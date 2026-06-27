"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  deactivateProduct,
  updateProduct,
} from "@/lib/actions/products";
import type { CategoryOption } from "@/components/products/CreateProductForm";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

type EditProductFormProps = {
  product: {
    id: string;
    name: string;
    categoryId: string;
    unitPrice: number;
    actif: boolean;
  };
  categories: CategoryOption[];
};

export function EditProductForm({ product, categories }: EditProductFormProps) {
  const router = useRouter();
  const [name, setName] = useState(product.name);
  const [categoryId, setCategoryId] = useState(product.categoryId);
  const [unitPrice, setUnitPrice] = useState(String(product.unitPrice));
  const [error, setError] = useState<string | null>(null);
  const [showDeactivateConfirm, setShowDeactivateConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await updateProduct(product.id, {
        name,
        categoryId,
        unitPrice: Number(unitPrice),
        actif: product.actif,
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  function handleDeactivateConfirm() {
    startTransition(async () => {
      const result = await deactivateProduct(product.id);

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        setShowDeactivateConfirm(false);
        return;
      }

      setShowDeactivateConfirm(false);
      router.push("/produits");
      router.refresh();
    });
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <Input
          label="Nom"
          name="name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          disabled={isPending || !product.actif}
        />

        <Select
          label="Catégorie"
          name="categoryId"
          value={categoryId}
          onChange={(event) => setCategoryId(event.target.value)}
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
          required
          disabled={isPending || !product.actif}
        />

        <Input
          label="Prix unitaire (€)"
          name="unitPrice"
          type="number"
          inputMode="decimal"
          step="0.01"
          min="0"
          value={unitPrice}
          onChange={(event) => setUnitPrice(event.target.value)}
          required
          disabled={isPending || !product.actif}
        />

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {product.actif ? (
          <Button type="submit" disabled={isPending}>
            {isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        ) : null}
      </form>

      {product.actif ? (
        <div className="mt-6 border-t border-border pt-6">
          <Button
            type="button"
            variant="danger"
            onClick={() => setShowDeactivateConfirm(true)}
            disabled={isPending}
          >
            Désactiver le produit
          </Button>
        </div>
      ) : null}

      <ConfirmDialog
        open={showDeactivateConfirm}
        title="Désactiver le produit ?"
        message={`« ${name} » sera masqué. L'historique existant est conservé.`}
        confirmLabel="Désactiver"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setShowDeactivateConfirm(false)}
        pending={isPending}
      />
    </>
  );
}
