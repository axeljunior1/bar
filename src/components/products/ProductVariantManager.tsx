"use client";

import { useState, useTransition } from "react";

import {
  createProductVariant,
  deactivateProductVariant,
  updateProductVariant,
} from "@/lib/actions/products";
import { formatVariantLabel } from "@/lib/products/variant-display";
import { formatCurrency } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";

export type ProductVariantItem = {
  id: string;
  size: string | null;
  color: string | null;
  unitPrice: number | null;
};

type ProductVariantManagerProps = {
  productId: string;
  productUnitPrice: number;
  variants: ProductVariantItem[];
};

function formatOptionalPrice(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseOptionalPrice(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function ProductVariantManager({
  productId,
  productUnitPrice,
  variants,
}: ProductVariantManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [newSize, setNewSize] = useState("");
  const [newColor, setNewColor] = useState("");
  const [newUnitPrice, setNewUnitPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSize, setEditSize] = useState("");
  const [editColor, setEditColor] = useState("");
  const [editUnitPrice, setEditUnitPrice] = useState("");
  const [pendingDeactivate, setPendingDeactivate] =
    useState<ProductVariantItem | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await createProductVariant({
        productId,
        size: newSize,
        color: newColor,
        unitPrice: parseOptionalPrice(newUnitPrice),
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setNewSize("");
      setNewColor("");
      setNewUnitPrice("");
    });
  }

  function startEditing(item: ProductVariantItem) {
    setEditingId(item.id);
    setEditSize(item.size ?? "");
    setEditColor(item.color ?? "");
    setEditUnitPrice(formatOptionalPrice(item.unitPrice));
    setError(null);
  }

  function handleUpdate(variantId: string) {
    startTransition(async () => {
      const result = await updateProductVariant({
        variantId,
        productId,
        size: editSize,
        color: editColor,
        unitPrice: parseOptionalPrice(editUnitPrice),
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setEditingId(null);
    });
  }

  function handleDeactivateConfirm() {
    if (!pendingDeactivate) {
      return;
    }

    startTransition(async () => {
      const result = await deactivateProductVariant({
        variantId: pendingDeactivate.id,
        productId,
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setPendingDeactivate(null);
    });
  }

  return (
    <section className="mb-8 flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Variantes (taille / couleur)</h2>
        <p className="mt-1 text-sm text-muted">
          Si des variantes existent, c&apos;est elles qui sont vendues et
          affichées en caisse. Laissez vide pour vendre le produit tel quel.
        </p>
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-border bg-white p-4"
      >
        <p className="mb-4 text-sm font-medium text-muted">Ajouter une variante</p>
        <div className="flex flex-col gap-3">
          <Input
            label="Taille (optionnel)"
            name="size"
            value={newSize}
            onChange={(event) => setNewSize(event.target.value)}
            placeholder="Ex. M, 50 cl"
            disabled={isPending}
          />
          <Input
            label="Couleur (optionnel)"
            name="color"
            value={newColor}
            onChange={(event) => setNewColor(event.target.value)}
            placeholder="Ex. Rouge, Blonde"
            disabled={isPending}
          />
          <Input
            label="Prix unitaire spécifique (optionnel)"
            name="unitPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={newUnitPrice}
            onChange={(event) => setNewUnitPrice(event.target.value)}
            placeholder={`Par défaut : ${formatCurrency(productUnitPrice)}`}
            disabled={isPending}
          />
          <Button type="submit" disabled={isPending}>
            Ajouter la variante
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!variants.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
          <p className="text-muted">Aucune variante active</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {variants.map((item) => {
            const label =
              formatVariantLabel(item.size, item.color) ?? "Variante";
            const isEditing = editingId === item.id;
            const effectivePrice = item.unitPrice ?? productUnitPrice;

            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border bg-white p-4"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Input
                      label="Taille"
                      value={editSize}
                      onChange={(event) => setEditSize(event.target.value)}
                      disabled={isPending}
                    />
                    <Input
                      label="Couleur"
                      value={editColor}
                      onChange={(event) => setEditColor(event.target.value)}
                      disabled={isPending}
                    />
                    <Input
                      label="Prix unitaire spécifique"
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={editUnitPrice}
                      onChange={(event) => setEditUnitPrice(event.target.value)}
                      disabled={isPending}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        size="md"
                        onClick={() => handleUpdate(item.id)}
                        disabled={isPending}
                      >
                        Enregistrer
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="md"
                        onClick={() => setEditingId(null)}
                        disabled={isPending}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-semibold">{label}</p>
                      {item.size ? (
                        <p className="text-sm text-muted">Taille : {item.size}</p>
                      ) : null}
                      {item.color ? (
                        <p className="text-sm text-muted">Couleur : {item.color}</p>
                      ) : null}
                      <p className="text-sm text-muted">
                        Prix unitaire : {formatCurrency(effectivePrice)}
                        {item.unitPrice === null ? " (produit)" : ""}
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Button
                        type="button"
                        variant="ghost"
                        size="md"
                        onClick={() => startEditing(item)}
                        disabled={isPending}
                      >
                        Modifier
                      </Button>
                      <Button
                        type="button"
                        variant="danger"
                        size="md"
                        onClick={() => setPendingDeactivate(item)}
                        disabled={isPending}
                      >
                        Retirer
                      </Button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!pendingDeactivate}
        title="Désactiver la variante ?"
        message={
          pendingDeactivate
            ? `« ${formatVariantLabel(pendingDeactivate.size, pendingDeactivate.color) ?? "Variante"} » sera masquée.`
            : ""
        }
        confirmLabel="Désactiver"
        onConfirm={handleDeactivateConfirm}
        onCancel={() => setPendingDeactivate(null)}
        pending={isPending}
      />
    </section>
  );
}
