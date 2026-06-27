"use client";

import { useState, useTransition } from "react";

import {
  reactivateBar,
  suspendBar,
} from "@/lib/actions/super-admin";
import type { SuperAdminBarListItem } from "@/lib/super-admin/queries";
import { formatDateTimeFr } from "@/lib/sales/period";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

type BarsListClientProps = {
  bars: SuperAdminBarListItem[];
};

type PendingAction = {
  bar: SuperAdminBarListItem;
  action: "suspend" | "reactivate";
};

export function BarsListClient({ bars }: BarsListClientProps) {
  const [pendingAction, setPendingAction] = useState<PendingAction | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    if (!pendingAction) {
      return;
    }

    startTransition(async () => {
      const result =
        pendingAction.action === "suspend"
          ? await suspendBar(pendingAction.bar.id)
          : await reactivateBar(pendingAction.bar.id);

      if (!result.success) {
        setError(result.error ?? "Une erreur est survenue.");
        return;
      }

      setError(null);
      setPendingAction(null);
    });
  }

  if (!bars.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
        <p className="text-muted">Aucun bar enregistré</p>
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
        {bars.map((bar) => (
          <li
            key={bar.id}
            className="rounded-3xl border border-border bg-white p-4"
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{bar.name}</p>
                <p className="text-sm text-muted">
                  Créé le {formatDateTimeFr(bar.createdAt)}
                </p>
              </div>
              <span
                className={
                  bar.status === "active"
                    ? "rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800"
                    : "rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-800"
                }
              >
                {bar.status === "active" ? "Actif" : "Suspendu"}
              </span>
            </div>

            {bar.status === "active" ? (
              <Button
                type="button"
                variant="danger"
                onClick={() =>
                  setPendingAction({ bar, action: "suspend" })
                }
                disabled={isPending}
              >
                Suspendre
              </Button>
            ) : (
              <Button
                type="button"
                onClick={() =>
                  setPendingAction({ bar, action: "reactivate" })
                }
                disabled={isPending}
              >
                Réactiver
              </Button>
            )}
          </li>
        ))}
      </ul>

      <ConfirmDialog
        open={!!pendingAction}
        title={
          pendingAction?.action === "suspend"
            ? "Suspendre ce bar ?"
            : "Réactiver ce bar ?"
        }
        message={
          pendingAction
            ? pendingAction.action === "suspend"
              ? `« ${pendingAction.bar.name} » ne pourra plus utiliser l'application.`
              : `« ${pendingAction.bar.name} » retrouvera l'accès à l'application.`
            : ""
        }
        confirmLabel={
          pendingAction?.action === "suspend" ? "Suspendre" : "Réactiver"
        }
        onConfirm={handleConfirm}
        onCancel={() => setPendingAction(null)}
        pending={isPending}
      />
    </>
  );
}
