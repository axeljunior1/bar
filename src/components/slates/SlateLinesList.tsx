"use client";

import { useCallback, useState } from "react";

import type { SlateLineItem } from "@/components/slates/types";
import { SlateLinePriceModal } from "@/components/slates/SlateLinePriceModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  formatVariantLabel,
  getSlateLinePrimaryLabel,
  getSlateLineSecondaryLabel,
} from "@/lib/products/variant-display";
import { formatCurrency } from "@/lib/utils/money";

type MutationResult = {
  success: boolean;
  error?: string;
};

type SlateLinesListProps = {
  lines: SlateLineItem[];
  readOnly?: boolean;
  getCatalogLineTotal?: (line: SlateLineItem) => number | null;
  onQuantityChange?: (
    lineId: string,
    quantity: number,
  ) => Promise<MutationResult>;
  onLineTotalChange?: (
    lineId: string,
    lineTotal: number | null,
  ) => Promise<MutationResult>;
  onRemove?: (lineId: string) => Promise<MutationResult>;
};

const MAX_LINE_QUANTITY = 99;

export function SlateLinesList({
  lines,
  readOnly = false,
  getCatalogLineTotal,
  onQuantityChange,
  onLineTotalChange,
  onRemove,
}: SlateLinesListProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingLine, setPendingLine] = useState<SlateLineItem | null>(null);
  const [priceLine, setPriceLine] = useState<SlateLineItem | null>(null);
  const [pendingLineIds, setPendingLineIds] = useState<Set<string>>(
    () => new Set(),
  );

  const markPending = useCallback((lineId: string, pending: boolean) => {
    setPendingLineIds((current) => {
      const next = new Set(current);
      if (pending) {
        next.add(lineId);
      } else {
        next.delete(lineId);
      }
      return next;
    });
  }, []);

  async function handleQuantityChange(line: SlateLineItem, nextQuantity: number) {
    if (
      readOnly ||
      !onQuantityChange ||
      nextQuantity < 1 ||
      nextQuantity > MAX_LINE_QUANTITY ||
      pendingLineIds.has(line.id)
    ) {
      return;
    }

    markPending(line.id, true);
    setError(null);

    const result = await onQuantityChange(line.id, nextQuantity);

    markPending(line.id, false);

    if (!result.success) {
      setError(result.error ?? "Impossible de modifier la quantité.");
    }
  }

  async function handleLineTotalConfirm(lineTotal: number | null) {
    if (!priceLine || !onLineTotalChange || pendingLineIds.has(priceLine.id)) {
      return;
    }

    markPending(priceLine.id, true);
    setError(null);

    const result = await onLineTotalChange(priceLine.id, lineTotal);

    markPending(priceLine.id, false);

    if (!result.success) {
      setError(result.error ?? "Impossible de modifier le prix.");
      return;
    }

    setPriceLine(null);
  }

  async function handleRemoveConfirm() {
    if (!pendingLine || !onRemove || pendingLineIds.has(pendingLine.id)) {
      return;
    }

    markPending(pendingLine.id, true);
    setError(null);

    const result = await onRemove(pendingLine.id);

    markPending(pendingLine.id, false);

    if (!result.success) {
      setError(result.error ?? "Impossible de supprimer la ligne.");
      return;
    }

    setPendingLine(null);
  }

  if (!lines.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
        <p className="text-muted">Aucune consommation pour le moment.</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {lines.map((line) => {
          const isUpdating = pendingLineIds.has(line.id);
          const catalogLineTotal = getCatalogLineTotal?.(line) ?? null;
          const isCustomPrice =
            catalogLineTotal !== null &&
            Math.abs(line.lineTotal - catalogLineTotal) > 0.001;
          const primaryLabel = getSlateLinePrimaryLabel(line);
          const secondaryLabel = getSlateLineSecondaryLabel(line);
          const hasVariant = Boolean(
            formatVariantLabel(line.variantSize, line.variantColor),
          );

          return (
            <li
              key={line.id}
              className="rounded-3xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{primaryLabel}</p>
                  <p className="text-sm text-muted">{secondaryLabel}</p>
                  {hasVariant ? (
                    <p className="text-sm text-muted">{line.packagingName}</p>
                  ) : null}
                  <p className="mt-1 text-sm text-muted">
                    {line.quantity} × {formatCurrency(line.unitPrice)} /{" "}
                    {line.packagingName}
                  </p>

                  {!readOnly ? (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <span className="text-sm text-muted">Qté</span>
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          fullWidth={false}
                          className="min-h-11 min-w-11 px-0 text-xl"
                          onClick={() =>
                            handleQuantityChange(line, line.quantity - 1)
                          }
                          disabled={isUpdating || line.quantity <= 1}
                          aria-label={`Diminuer la quantité de ${line.productName}`}
                        >
                          −
                        </Button>
                        <span
                          className="min-w-10 text-center text-lg font-semibold"
                          aria-live="polite"
                        >
                          {line.quantity}
                        </span>
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          fullWidth={false}
                          className="min-h-11 min-w-11 px-0 text-xl"
                          onClick={() =>
                            handleQuantityChange(line, line.quantity + 1)
                          }
                          disabled={
                            isUpdating || line.quantity >= MAX_LINE_QUANTITY
                          }
                          aria-label={`Augmenter la quantité de ${line.productName}`}
                        >
                          +
                        </Button>
                      </div>
                      {onLineTotalChange ? (
                        <Button
                          type="button"
                          variant="secondary"
                          size="md"
                          fullWidth={false}
                          className="min-h-11 px-3"
                          onClick={() => setPriceLine(line)}
                          disabled={isUpdating}
                        >
                          Prix
                        </Button>
                      ) : null}
                    </div>
                  ) : (
                    <p className="mt-2 text-sm text-muted">
                      {line.quantity} × {line.packagingName}
                    </p>
                  )}
                </div>

                <div className="shrink-0 text-right">
                  <p className="text-lg font-bold text-brand-700">
                    {formatCurrency(line.lineTotal)}
                    {isCustomPrice ? (
                      <span className="ml-2 inline-block rounded-full bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-800">
                        Prix forcé
                      </span>
                    ) : null}
                  </p>
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      fullWidth={false}
                      className="mt-1 min-w-0 px-2"
                      onClick={() => setPendingLine(line)}
                      disabled={isUpdating}
                    >
                      Retirer
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {priceLine ? (
        <SlateLinePriceModal
          key={priceLine.id}
          open
          line={priceLine}
          catalogLineTotal={
            getCatalogLineTotal?.(priceLine) ?? null
          }
          onConfirm={handleLineTotalConfirm}
          onCancel={() => setPriceLine(null)}
          pending={pendingLineIds.has(priceLine.id)}
        />
      ) : null}

      <ConfirmDialog
        open={!!pendingLine}
        title="Retirer la ligne ?"
        message={
          pendingLine
            ? `Supprimer « ${pendingLine.productName} · ${pendingLine.packagingName} » de l'ardoise ?`
            : ""
        }
        confirmLabel="Retirer"
        onConfirm={handleRemoveConfirm}
        onCancel={() => setPendingLine(null)}
        pending={pendingLine ? pendingLineIds.has(pendingLine.id) : false}
      />
    </>
  );
}
