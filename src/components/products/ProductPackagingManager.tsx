"use client";

import { useState, useTransition } from "react";

import {
  createProductPackaging,
  deactivateProductPackaging,
  updateProductPackaging,
} from "@/lib/actions/products";
import { computePackagingPrice, formatCurrency } from "@/lib/utils/money";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";

export type PackagingTypeOption = {
  id: string;
  name: string;
};

export type ProductPackagingItem = {
  id: string;
  packagingTypeId: string;
  packagingTypeName: string;
  quantity: number;
  optionalPrice: number | null;
};

type ProductPackagingManagerProps = {
  productId: string;
  unitPrice: number;
  packagingTypes: PackagingTypeOption[];
  packagings: ProductPackagingItem[];
};

function formatOptionalPrice(value: number | null): string {
  return value === null ? "" : String(value);
}

function parseOptionalPrice(value: string): number | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : Number(trimmed);
}

export function ProductPackagingManager({
  productId,
  unitPrice,
  packagingTypes,
  packagings,
}: ProductPackagingManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [newTypeId, setNewTypeId] = useState("");
  const [newQuantity, setNewQuantity] = useState("1");
  const [newOptionalPrice, setNewOptionalPrice] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTypeId, setEditTypeId] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editOptionalPrice, setEditOptionalPrice] = useState("");
  const [pendingDeactivate, setPendingDeactivate] =
    useState<ProductPackagingItem | null>(null);
  const [isPending, startTransition] = useTransition();

  const isSellable = packagings.length > 0;

  function handleAdd(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!newTypeId) {
      setError("Sélectionnez un type de conditionnement.");
      return;
    }

    startTransition(async () => {
      const result = await createProductPackaging({
        productId,
        packagingTypeId: newTypeId,
        quantity: Number(newQuantity),
        optionalPrice: parseOptionalPrice(newOptionalPrice),
      });

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setNewTypeId("");
      setNewQuantity("1");
      setNewOptionalPrice("");
    });
  }

  function startEditing(item: ProductPackagingItem) {
    setEditingId(item.id);
    setEditTypeId(item.packagingTypeId);
    setEditQuantity(String(item.quantity));
    setEditOptionalPrice(formatOptionalPrice(item.optionalPrice));
    setError(null);
  }

  function cancelEditing() {
    setEditingId(null);
  }

  function handleUpdate(packagingId: string) {
    startTransition(async () => {
      const result = await updateProductPackaging({
        packagingId,
        productId,
        packagingTypeId: editTypeId,
        quantity: Number(editQuantity),
        optionalPrice: parseOptionalPrice(editOptionalPrice),
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
      const result = await deactivateProductPackaging({
        packagingId: pendingDeactivate.id,
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

  const newFinalPrice = computePackagingPrice(
    unitPrice,
    Number(newQuantity) || 0,
    parseOptionalPrice(newOptionalPrice),
  );

  return (
    <section className="flex flex-col gap-4">
      <div>
        <h2 className="text-lg font-semibold">Conditionnements de vente</h2>
        {!isSellable ? (
          <p className="mt-1 text-sm text-amber-700">
            Ajoutez au moins un conditionnement pour rendre ce produit vendable.
          </p>
        ) : null}
      </div>

      <form
        onSubmit={handleAdd}
        className="rounded-3xl border border-border bg-white p-4"
      >
        <p className="mb-4 text-sm font-medium text-muted">Ajouter</p>
        <div className="flex flex-col gap-3">
          <Select
            label="Type"
            name="packagingTypeId"
            value={newTypeId}
            onChange={(event) => setNewTypeId(event.target.value)}
            options={packagingTypes.map((type) => ({
              value: type.id,
              label: type.name,
            }))}
            disabled={isPending || !packagingTypes.length}
          />
          <Input
            label="Quantité"
            name="quantity"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0.001"
            value={newQuantity}
            onChange={(event) => setNewQuantity(event.target.value)}
            required
            disabled={isPending}
          />
          <Input
            label="Prix manuel (optionnel)"
            name="optionalPrice"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={newOptionalPrice}
            onChange={(event) => setNewOptionalPrice(event.target.value)}
            placeholder="Laisser vide = quantité × prix unitaire"
            disabled={isPending}
          />
          <p className="text-sm text-muted">
            Prix final :{" "}
            <span className="font-semibold text-foreground">
              {formatCurrency(newFinalPrice)}
            </span>
          </p>
          <Button type="submit" disabled={isPending || !packagingTypes.length}>
            Ajouter
          </Button>
        </div>
      </form>

      {error ? (
        <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!packagings.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
          <p className="text-muted">Aucun conditionnement actif</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {packagings.map((item) => {
            const isEditing = editingId === item.id;
            const finalPrice = computePackagingPrice(
              unitPrice,
              isEditing ? Number(editQuantity) || 0 : item.quantity,
              isEditing
                ? parseOptionalPrice(editOptionalPrice)
                : item.optionalPrice,
            );

            return (
              <li
                key={item.id}
                className="rounded-3xl border border-border bg-white p-4"
              >
                {isEditing ? (
                  <div className="flex flex-col gap-3">
                    <Select
                      label="Type"
                      name={`edit-type-${item.id}`}
                      value={editTypeId}
                      onChange={(event) => setEditTypeId(event.target.value)}
                      options={packagingTypes.map((type) => ({
                        value: type.id,
                        label: type.name,
                      }))}
                      disabled={isPending}
                    />
                    <Input
                      label="Quantité"
                      name={`edit-quantity-${item.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.001"
                      min="0.001"
                      value={editQuantity}
                      onChange={(event) => setEditQuantity(event.target.value)}
                      disabled={isPending}
                    />
                    <Input
                      label="Prix manuel (optionnel)"
                      name={`edit-price-${item.id}`}
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="0"
                      value={editOptionalPrice}
                      onChange={(event) =>
                        setEditOptionalPrice(event.target.value)
                      }
                      disabled={isPending}
                    />
                    <p className="text-sm text-muted">
                      Prix final :{" "}
                      <span className="font-semibold text-foreground">
                        {formatCurrency(finalPrice)}
                      </span>
                    </p>
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
                        onClick={cancelEditing}
                        disabled={isPending}
                      >
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    <div>
                      <p className="text-lg font-semibold">
                        {item.packagingTypeName}
                      </p>
                      <p className="text-sm text-muted">
                        Quantité : {item.quantity}
                      </p>
                      <p className="text-sm text-muted">
                        Prix final : {formatCurrency(finalPrice)}
                      </p>
                      {item.optionalPrice !== null ? (
                        <p className="text-xs text-muted">
                          Prix manuel : {formatCurrency(item.optionalPrice)}
                        </p>
                      ) : null}
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
        title="Désactiver le conditionnement ?"
        message={
          pendingDeactivate
            ? `« ${pendingDeactivate.packagingTypeName} » sera masqué. L'historique existant est conservé.`
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
