"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { checkoutSlate } from "@/lib/actions/slates";
import type {
  PaymentMethodOption,
  SlateLineItem,
} from "@/components/slates/types";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
  getSlateLinePrimaryLabel,
} from "@/lib/products/variant-display";
import { formatCurrency } from "@/lib/utils/money";

type SlateCheckoutModalProps = {
  open: boolean;
  slateId: string;
  clientName: string;
  lines: SlateLineItem[];
  total: number;
  paymentMethods: PaymentMethodOption[];
  onClose: () => void;
};

export function SlateCheckoutModal({
  open,
  slateId,
  clientName,
  lines,
  total,
  paymentMethods,
  onClose,
}: SlateCheckoutModalProps) {
  const router = useRouter();
  const [paymentMethodId, setPaymentMethodId] = useState(
    paymentMethods[0]?.id ?? "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!paymentMethodId) {
      setError("Sélectionnez un moyen de paiement.");
      return;
    }

    startTransition(async () => {
      const result = await checkoutSlate(slateId, paymentMethodId);

      if (!result.success) {
        setError(result.error ?? "Encaissement impossible.");
        return;
      }

      onClose();
      router.push("/");
    });
  }

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-3xl bg-white shadow-xl"
      >
        <div className="overflow-y-auto p-5">
          <h2 className="text-xl font-semibold">Encaisser l&apos;ardoise</h2>
          <p className="mt-1 text-muted">{clientName}</p>

          <ul className="mt-4 space-y-2">
            {lines.map((line) => {
              const primaryLabel = getSlateLinePrimaryLabel(line);

              return (
              <li
                key={line.id}
                className="flex items-center justify-between gap-3 text-sm"
              >
                <span className="min-w-0 truncate">
                  {line.quantity}× {primaryLabel} · {line.packagingName}
                </span>
                <span className="shrink-0 font-medium">
                  {formatCurrency(line.lineTotal)}
                </span>
              </li>
              );
            })}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
            <span className="text-lg font-semibold">Total</span>
            <span className="text-2xl font-bold text-brand-700">
              {formatCurrency(total)}
            </span>
          </div>

          <div className="mt-4">
            <Select
              label="Moyen de paiement"
              name="paymentMethodId"
              value={paymentMethodId}
              onChange={(event) => setPaymentMethodId(event.target.value)}
              options={paymentMethods.map((method) => ({
                value: method.id,
                label: method.name,
              }))}
              disabled={isPending || !paymentMethods.length}
            />
          </div>

          {error ? (
            <p className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
              {error}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 border-t border-border p-5">
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isPending || !paymentMethods.length || !lines.length}
          >
            {isPending ? "Encaissement..." : "Confirmer l'encaissement"}
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={isPending}
          >
            Annuler
          </Button>
        </div>
      </div>
    </div>
  );
}
