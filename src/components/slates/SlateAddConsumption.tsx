"use client";

import { useCallback, useState } from "react";

import type {
  SellableCategory,
  SellableProduct,
  SellableVariant,
} from "@/components/slates/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { getPackagingSellPrice } from "@/lib/products/pricing";
import { formatVariantLabel } from "@/lib/products/variant-display";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/money";

type MutationResult = {
  success: boolean;
  error?: string;
};

type PendingPackaging = {
  id: string;
  variantId: string | null;
  productName: string;
  variantLabel: string | null;
  typeName: string;
  catalogPrice: number;
};

type SlateAddConsumptionProps = {
  categories: SellableCategory[];
  products: SellableProduct[];
  onAdd: (
    packagingId: string,
    variantId: string | null,
    lineTotal?: number,
  ) => Promise<MutationResult>;
};

function pendingKey(packagingId: string, variantId: string | null) {
  return `${packagingId}:${variantId ?? ""}`;
}

function getPackagingPrice(
  product: SellableProduct,
  packaging: SellableProduct["packagings"][number],
  variant?: SellableVariant,
) {
  return getPackagingSellPrice(
    product.unitPrice,
    packaging,
    variant?.unitPrice,
  );
}

export function SlateAddConsumption({
  categories,
  products,
  onAdd,
}: SlateAddConsumptionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [pendingKeys, setPendingKeys] = useState<Set<string>>(() => new Set());
  const [priceModalPackaging, setPriceModalPackaging] =
    useState<PendingPackaging | null>(null);
  const [priceInput, setPriceInput] = useState("");
  const [priceError, setPriceError] = useState<string | null>(null);

  const markPending = useCallback(
    (packagingId: string, variantId: string | null, pending: boolean) => {
      const key = pendingKey(packagingId, variantId);
      setPendingKeys((current) => {
        const next = new Set(current);
        if (pending) {
          next.add(key);
        } else {
          next.delete(key);
        }
        return next;
      });
    },
    [],
  );

  const filteredProducts = products.filter(
    (product) => product.categoryId === selectedCategoryId,
  );

  async function handleAdd(
    packagingId: string,
    variantId: string | null,
    lineTotal?: number,
  ) {
    markPending(packagingId, variantId, true);
    setError(null);

    const result = await onAdd(packagingId, variantId, lineTotal);

    markPending(packagingId, variantId, false);

    if (!result.success) {
      setError(result.error ?? "Impossible d'ajouter la consommation.");
      return false;
    }

    return true;
  }

  function renderPackagingButtons(
    product: SellableProduct,
    variant: SellableVariant | null,
  ) {
    return product.packagings.map((packaging) => {
      const variantId = variant?.id ?? null;
      const key = pendingKey(packaging.id, variantId);
      const isPending = pendingKeys.has(key);
      const price = getPackagingPrice(product, packaging, variant ?? undefined);
      const variantLabel = variant
        ? formatVariantLabel(variant.size, variant.color)
        : null;
      const displayName = variantLabel ?? product.name;

      return (
        <div
          key={`${packaging.id}:${variantId ?? "base"}`}
          className="inline-flex overflow-hidden rounded-xl border border-border"
        >
          <button
            type="button"
            onClick={() => handleAdd(packaging.id, variantId)}
            disabled={isPending}
            className="inline-flex min-h-10 items-center bg-surface-muted px-3 py-2 text-sm font-medium text-foreground active:bg-brand-50 disabled:opacity-50"
          >
            {packaging.typeName} · {formatCurrency(price)}
          </button>
          <button
            type="button"
            onClick={() => {
              setPriceInput(String(price));
              setPriceError(null);
              setPriceModalPackaging({
                id: packaging.id,
                variantId,
                productName: product.name,
                variantLabel,
                typeName: packaging.typeName,
                catalogPrice: price,
              });
            }}
            disabled={isPending}
            className="inline-flex min-h-10 min-w-10 items-center justify-center border-l border-border bg-white px-2 text-sm font-semibold text-brand-700 active:bg-brand-50 disabled:opacity-50"
            aria-label={`Ajouter ${displayName} ${packaging.typeName} avec un prix personnalisé`}
          >
            €
          </button>
        </div>
      );
    });
  }

  async function handleCustomPriceSubmit(event: React.FormEvent) {
    event.preventDefault();

    if (!priceModalPackaging) {
      return;
    }

    const parsed = Number(priceInput.replace(",", "."));

    if (!Number.isFinite(parsed) || parsed < 0) {
      setPriceError("Saisissez un prix valide.");
      return;
    }

    const success = await handleAdd(
      priceModalPackaging.id,
      priceModalPackaging.variantId,
      parsed,
    );

    if (success) {
      setPriceModalPackaging(null);
    }
  }

  if (!categories.length || !products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
        <p className="text-muted">Aucun produit vendable disponible.</p>
      </div>
    );
  }

  return (
    <>
      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-semibold">Ajouter une consommation</h2>

        <div>
          <p className="mb-2 text-sm font-medium text-muted">Catégorie</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {categories.map((category) => {
              const isActive = category.id === selectedCategoryId;

              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setError(null);
                  }}
                  className={cn(
                    "shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-brand-600 text-white"
                      : "border border-border bg-white text-foreground",
                  )}
                >
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        {!filteredProducts.length ? (
          <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
            <p className="text-muted">Aucun produit dans cette catégorie.</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {filteredProducts.map((product) => (
              <li
                key={product.id}
                className="rounded-3xl border border-border bg-white p-4"
              >
                {product.variants.length > 0 ? (
                  <div className="space-y-4">
                    <p className="text-base font-semibold">{product.name}</p>
                    {product.variants.map((variant) => {
                      const variantLabel = formatVariantLabel(
                        variant.size,
                        variant.color,
                      );

                      return (
                        <div key={variant.id} className="space-y-2">
                          <p className="text-sm font-medium text-brand-700">
                            {variantLabel}
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {renderPackagingButtons(product, variant)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <>
                    <p className="mb-2 text-base font-semibold">{product.name}</p>
                    <div className="flex flex-wrap gap-2">
                      {renderPackagingButtons(product, null)}
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {priceModalPackaging ? (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl"
          >
            <h2 className="text-lg font-semibold">Ajouter avec total forcé</h2>
            <p className="mt-1 text-sm text-muted">
              {priceModalPackaging.variantLabel ?? priceModalPackaging.productName}
              {" · "}
              {priceModalPackaging.typeName}
            </p>
            {priceModalPackaging.variantLabel ? (
              <p className="text-sm text-muted">{priceModalPackaging.productName}</p>
            ) : null}
            <p className="mt-2 text-sm text-muted">
              Total catalogue : {formatCurrency(priceModalPackaging.catalogPrice)}
            </p>

            <form className="mt-4 space-y-4" onSubmit={handleCustomPriceSubmit}>
              <Input
                label="Total ligne (€)"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                value={priceInput}
                onChange={(event) => {
                  setPriceInput(event.target.value);
                  setPriceError(null);
                }}
                error={priceError ?? undefined}
                autoFocus
              />

              <div className="flex flex-col gap-3">
                <Button
                  type="submit"
                  disabled={pendingKeys.has(
                    pendingKey(
                      priceModalPackaging.id,
                      priceModalPackaging.variantId,
                    ),
                  )}
                >
                  {pendingKeys.has(
                    pendingKey(
                      priceModalPackaging.id,
                      priceModalPackaging.variantId,
                    ),
                  )
                    ? "En cours..."
                    : "Ajouter"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setPriceModalPackaging(null)}
                >
                  Annuler
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
