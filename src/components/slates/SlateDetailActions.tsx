"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { cancelSlate } from "@/lib/actions/slates";
import type {
  PaymentMethodOption,
  SlateLineItem,
} from "@/components/slates/types";
import { SlateCheckoutModal } from "@/components/slates/SlateCheckoutModal";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { formatCurrency } from "@/lib/utils/money";

type SlateDetailActionsProps = {
  slateId: string;
  clientName: string;
  lines: SlateLineItem[];
  total: number;
  paymentMethods: PaymentMethodOption[];
};

export function SlateDetailActions({
  slateId,
  clientName,
  lines,
  total,
  paymentMethods,
}: SlateDetailActionsProps) {
  const router = useRouter();
  const [showCheckout, setShowCheckout] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleCancelConfirm() {
    startTransition(async () => {
      const result = await cancelSlate(slateId);

      if (!result.success) {
        setError(result.error ?? "Impossible d'annuler l'ardoise.");
        return;
      }

      setShowCancelConfirm(false);
      router.push("/");
      router.refresh();
    });
  }

  return (
    <>
      <div className="sticky bottom-[calc(var(--nav-height)+env(safe-area-inset-bottom))] z-30 -mx-4 border-t border-border bg-white/95 px-4 py-4 backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-muted">Total ardoise</span>
          <span className="text-2xl font-bold text-brand-700">
            {formatCurrency(total)}
          </span>
        </div>

        {error ? (
          <p className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-2 gap-3">
          <Button
            type="button"
            variant="danger"
            size="md"
            onClick={() => setShowCancelConfirm(true)}
            disabled={isPending}
          >
            Annuler
          </Button>
          <Button
            type="button"
            size="md"
            onClick={() => setShowCheckout(true)}
            disabled={isPending || !lines.length}
          >
            Encaisser
          </Button>
        </div>
      </div>

      <SlateCheckoutModal
        open={showCheckout}
        slateId={slateId}
        clientName={clientName}
        lines={lines}
        total={total}
        paymentMethods={paymentMethods}
        onClose={() => setShowCheckout(false)}
      />

      <ConfirmDialog
        open={showCancelConfirm}
        title="Annuler l'ardoise ?"
        message={`L'ardoise « ${clientName} » sera annulée. Les lignes seront conservées.`}
        confirmLabel="Annuler l'ardoise"
        onConfirm={handleCancelConfirm}
        onCancel={() => setShowCancelConfirm(false)}
        pending={isPending}
      />
    </>
  );
}
