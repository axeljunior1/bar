"use client";

import { useState, useTransition } from "react";

import { markKitchenItemServed } from "@/lib/actions/kitchen";
import type { KitchenQueueItem } from "@/lib/kitchen/queries";
import { formatTimeFr } from "@/lib/sales/period";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type KitchenQueueProps = {
  items: KitchenQueueItem[];
};

export function KitchenQueue({ items }: KitchenQueueProps) {
  const [pendingItem, setPendingItem] = useState<KitchenQueueItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirmServed() {
    if (!pendingItem) {
      return;
    }

    startTransition(async () => {
      const result = await markKitchenItemServed(pendingItem.id);

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setPendingItem(null);
    });
  }

  if (!items.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
        <p className="text-muted">Aucune commande en attente</p>
      </div>
    );
  }

  return (
    <>
      {error ? (
        <p className="mb-4 rounded-2xl bg-red-50 px-4 py-3 text-sm text-danger">
          {error}
        </p>
      ) : null}

      <ul className="space-y-3">
        {items.map((item) => (
          <li
            key={item.id}
            className="rounded-3xl border border-border bg-white p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{item.clientName}</p>
                {item.location ? (
                  <p className="text-sm text-brand-700">{item.location}</p>
                ) : null}
                {item.note ? (
                  <p className="truncate text-sm text-muted">{item.note}</p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm text-muted">
                {formatTimeFr(item.createdAt)}
              </span>
            </div>

            <div className="mb-4 rounded-2xl bg-surface-muted px-3 py-3">
              <p className="text-lg font-semibold">
                {item.quantity > 1 ? `${item.quantity} × ` : ""}
                {item.productName}
              </p>
              {item.packagingName ? (
                <p className="text-sm text-muted">{item.packagingName}</p>
              ) : null}
            </div>

            <Button
              type="button"
              size="md"
              onClick={() => setPendingItem(item)}
              disabled={isPending}
            >
              Marquer servi
            </Button>
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!pendingItem}
        title="Marquer comme servi ?"
        message={
          pendingItem
            ? `${pendingItem.productName} pour ${pendingItem.clientName} sera retiré de la file.`
            : ""
        }
        confirmLabel="Marquer servi"
        onConfirm={handleConfirmServed}
        onCancel={() => setPendingItem(null)}
        pending={isPending}
      />
    </>
  );
}
