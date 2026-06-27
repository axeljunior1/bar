"use client";

import { useState, useTransition } from "react";

import {
  removeSlateLine,
  updateSlateLineQuantity,
} from "@/lib/actions/slates";
import type { SlateLineItem } from "@/components/slates/types";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/money";

type SlateLinesListProps = {
  slateId: string;
  lines: SlateLineItem[];
  readOnly?: boolean;
};

const MAX_LINE_QUANTITY = 99;

export function SlateLinesList({
  slateId,
  lines,
  readOnly = false,
}: SlateLinesListProps) {
  const [error, setError] = useState<string | null>(null);
  const [pendingLine, setPendingLine] = useState<SlateLineItem | null>(null);
  const [updatingLineId, setUpdatingLineId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleQuantityChange(line: SlateLineItem, nextQuantity: number) {
    if (nextQuantity < 1 || nextQuantity > MAX_LINE_QUANTITY) {
      return;
    }

    setUpdatingLineId(line.id);

    startTransition(async () => {
      const result = await updateSlateLineQuantity(
        slateId,
        line.id,
        nextQuantity,
      );

      setUpdatingLineId(null);

      if (!result.success) {
        setError(result.error ?? "Impossible de modifier la quantité.");
        return;
      }

      setError(null);
    });
  }

  function handleRemoveConfirm() {
    if (!pendingLine) {
      return;
    }

    startTransition(async () => {
      const result = await removeSlateLine(slateId, pendingLine.id);

      if (!result.success) {
        setError(result.error ?? "Impossible de supprimer la ligne.");
        return;
      }

      setError(null);
      setPendingLine(null);
    });
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
          const isUpdating = isPending && updatingLineId === line.id;

          return (
            <li
              key={line.id}
              className="rounded-3xl border border-border bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{line.productName}</p>
                  <p className="text-sm text-muted">{line.packagingName}</p>
                  <p className="mt-1 text-sm text-muted">
                    {formatCurrency(line.unitPrice)} / {line.packagingName}
                  </p>

                  {!readOnly ? (
                    <div className="mt-3 flex items-center gap-3">
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
                          disabled={isPending || line.quantity <= 1}
                          aria-label={`Diminuer la quantité de ${line.productName}`}
                        >
                          −
                        </Button>
                        <span
                          className="min-w-10 text-center text-lg font-semibold"
                          aria-live="polite"
                        >
                          {isUpdating ? "…" : line.quantity}
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
                            isPending || line.quantity >= MAX_LINE_QUANTITY
                          }
                          aria-label={`Augmenter la quantité de ${line.productName}`}
                        >
                          +
                        </Button>
                      </div>
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
                  </p>
                  {!readOnly ? (
                    <Button
                      type="button"
                      variant="ghost"
                      size="md"
                      fullWidth={false}
                      className="mt-1 min-w-0 px-2"
                      onClick={() => setPendingLine(line)}
                      disabled={isPending}
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
        pending={isPending}
      />
    </>
  );
}
