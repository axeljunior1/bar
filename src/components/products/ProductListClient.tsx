"use client";

import { useMemo, useState } from "react";
import Link from "next/link";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/money";

export type ProductListItem = {
  id: string;
  name: string;
  categoryName: string;
  unitPrice: number;
  packagingCount: number;
  isKitchenItem: boolean;
};

type ProductListClientProps = {
  products: ProductListItem[];
};

function normalizeSearch(value: string) {
  return value
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");
}

export function ProductListClient({ products }: ProductListClientProps) {
  const [query, setQuery] = useState("");

  const filteredProducts = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    if (!normalizedQuery) {
      return products;
    }

    return products.filter((product) => {
      const haystack = normalizeSearch(
        `${product.name} ${product.categoryName}`,
      );
      return haystack.includes(normalizedQuery);
    });
  }, [products, query]);

  return (
    <div className="flex flex-col gap-4">
      <Link href="/produits/new">
        <Button>Nouveau produit</Button>
      </Link>

      <Input
        label="Rechercher"
        name="search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Nom ou catégorie"
        autoComplete="off"
        capitalize={false}
      />

      <p className="text-sm text-muted">
        {filteredProducts.length} produit
        {filteredProducts.length > 1 ? "s" : ""}
        {query.trim() ? " trouvé(s)" : ""}
      </p>

      {!products.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
          <p className="text-muted">Aucun produit actif</p>
          <p className="mt-2 text-sm text-muted">
            Créez votre premier produit pour commencer.
          </p>
        </div>
      ) : !filteredProducts.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
          <p className="text-muted">Aucun résultat pour « {query.trim()} »</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filteredProducts.map((product) => (
            <li key={product.id}>
              <Link
                href={`/produits/${product.id}`}
                className="block rounded-3xl border border-border bg-white p-4 active:bg-surface-muted"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-lg font-semibold">
                        {product.name}
                      </p>
                      {product.isKitchenItem ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                          Cuisine
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-muted">{product.categoryName}</p>
                    <p className="mt-1 text-sm text-muted">
                      {product.packagingCount} conditionnement
                      {product.packagingCount > 1 ? "s" : ""}
                      {product.packagingCount === 0 ? " · Non vendable" : ""}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-lg font-bold text-brand-700">
                      {formatCurrency(product.unitPrice)}
                    </p>
                    <p className="text-sm text-brand-600">Voir</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
