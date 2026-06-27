"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { addSlateLine } from "@/lib/actions/slates";
import type {
  SellableCategory,
  SellableProduct,
} from "@/components/slates/types";
import { cn } from "@/lib/utils/cn";
import { formatCurrency } from "@/lib/utils/money";

type SlateAddConsumptionProps = {
  slateId: string;
  categories: SellableCategory[];
  products: SellableProduct[];
};

export function SlateAddConsumption({
  slateId,
  categories,
  products,
}: SlateAddConsumptionProps) {
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    categories[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const filteredProducts = products.filter(
    (product) => product.categoryId === selectedCategoryId,
  );

  function handleAdd(packagingId: string) {
    startTransition(async () => {
      const result = await addSlateLine(slateId, packagingId, 1);

      if (!result.success) {
        setError(result.error ?? "Impossible d'ajouter la consommation.");
        return;
      }

      setError(null);
      router.refresh();
    });
  }

  if (!categories.length || !products.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
        <p className="text-muted">Aucun produit vendable disponible.</p>
      </div>
    );
  }

  return (
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
                    : "bg-white text-foreground border border-border",
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
              <p className="mb-2 text-base font-semibold">{product.name}</p>
              <div className="flex flex-wrap gap-2">
                {product.packagings.map((packaging) => (
                  <button
                    key={packaging.id}
                    type="button"
                    onClick={() => handleAdd(packaging.id)}
                    disabled={isPending}
                    className="inline-flex min-h-10 items-center rounded-xl border border-border bg-surface-muted px-3 py-2 text-sm font-medium text-foreground active:bg-brand-50 disabled:opacity-50"
                  >
                    {packaging.typeName} · {formatCurrency(packaging.price)}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
