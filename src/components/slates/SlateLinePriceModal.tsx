"use client";

import { useEffect, useState } from "react";

import type { SlateLineItem } from "@/components/slates/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { formatCurrency } from "@/lib/utils/money";

type SlateLinePriceModalProps = {
  open: boolean;
  line: SlateLineItem | null;
  catalogLineTotal: number | null;
  onConfirm: (lineTotal: number | null) => void;
  onCancel: () => void;
  pending?: boolean;
};

export function SlateLinePriceModal({
  open,
  line,
  catalogLineTotal,
  onConfirm,
  onCancel,
  pending = false,
}: SlateLinePriceModalProps) {
  const [priceInput, setPriceInput] = useState(() => String(line?.lineTotal ?? ""));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onCancel();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onCancel]);

  if (!open || !line) {
    return null;
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();

    const parsed = Number(priceInput.replace(",", "."));

    if (!Number.isFinite(parsed) || parsed < 0) {
      setError("Saisissez un prix valide.");
      return;
    }

    onConfirm(parsed);
  }

  const isCustomPrice =
    catalogLineTotal !== null &&
    Math.abs(line.lineTotal - catalogLineTotal) > 0.001;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="slate-line-price-title"
        className="w-full max-w-lg rounded-3xl bg-white p-5 shadow-xl"
      >
        <h2 id="slate-line-price-title" className="text-lg font-semibold">
          Forcer le prix de la ligne
        </h2>
        <p className="mt-1 text-sm text-muted">
          {line.productName} · {line.packagingName}
        </p>

        {catalogLineTotal !== null ? (
          <p className="mt-2 text-sm text-muted">
            Total catalogue ({line.quantity} ×) : {formatCurrency(catalogLineTotal)}
            {isCustomPrice ? " · total actuel modifié" : null}
          </p>
        ) : null}

        <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
          <Input
            label="Total ligne (€)"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            value={priceInput}
            onChange={(event) => {
              setPriceInput(event.target.value);
              setError(null);
            }}
            error={error ?? undefined}
            autoFocus
          />

          <p className="text-sm text-muted">
            Prix unitaire équivalent :{" "}
            {formatCurrency(
              (Number(priceInput.replace(",", ".")) || 0) / line.quantity,
            )}
          </p>

          <div className="flex flex-col gap-3">
            <Button type="submit" disabled={pending}>
              {pending ? "En cours..." : "Appliquer"}
            </Button>
            {catalogLineTotal !== null && isCustomPrice ? (
              <Button
                type="button"
                variant="secondary"
                disabled={pending}
                onClick={() => onConfirm(null)}
              >
                Reprendre le prix catalogue
              </Button>
            ) : null}
            <Button
              type="button"
              variant="ghost"
              disabled={pending}
              onClick={onCancel}
            >
              Annuler
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
