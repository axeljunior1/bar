"use client";

import { useCallback, useRef, useState } from "react";

import type { SellableProduct, SlateLineItem } from "@/components/slates/types";
import {
  addSlateLine,
  removeSlateLine,
  updateSlateLineLineTotal,
  updateSlateLineQuantity,
} from "@/lib/actions/slates";
import {
  applyOptimisticAdd,
  applyOptimisticLineTotal,
  applyOptimisticQuantity,
  applyOptimisticRemove,
  findCatalogPackaging,
  reconcileLineFromServer,
  revertOptimisticAdd,
  sumLineTotals,
} from "@/lib/slates/line-mutations";

type MutationResult = {
  success: boolean;
  error?: string;
};

type UseSlateLineMutationsOptions = {
  slateId: string;
  products: SellableProduct[];
  initialLines: SlateLineItem[];
  initialTotal: number;
};

export function useSlateLineMutations({
  slateId,
  products,
  initialLines,
  initialTotal,
}: UseSlateLineMutationsOptions) {
  const [lines, setLines] = useState(initialLines);
  const [total, setTotal] = useState(initialTotal);
  const linesRef = useRef(initialLines);
  const rpcQueueRef = useRef(Promise.resolve());

  const applyLocalState = useCallback(
    (nextLines: SlateLineItem[], nextTotal?: number) => {
      linesRef.current = nextLines;
      const resolvedTotal = nextTotal ?? sumLineTotals(nextLines);
      setLines(nextLines);
      setTotal(resolvedTotal);
    },
    [],
  );

  const enqueueRpc = useCallback(<T,>(task: () => Promise<T>): Promise<T> => {
    const run = rpcQueueRef.current.then(task, task);
    rpcQueueRef.current = run.then(
      () => undefined,
      () => undefined,
    );
    return run;
  }, []);

  const getCatalogUnitPrice = useCallback(
    (line: SlateLineItem) =>
      findCatalogPackaging(
        products,
        line.productPackagingId,
        line.productVariantId,
      )?.price ?? null,
    [products],
  );

  const getCatalogLineTotal = useCallback(
    (line: SlateLineItem) => {
      const catalogUnitPrice = getCatalogUnitPrice(line);
      return catalogUnitPrice === null
        ? null
        : catalogUnitPrice * line.quantity;
    },
    [getCatalogUnitPrice],
  );

  const handleAdd = useCallback(
    async (
      packagingId: string,
      variantId: string | null,
      lineTotal?: number,
    ): Promise<MutationResult> => {
      const optimisticLines = applyOptimisticAdd(
        linesRef.current,
        products,
        packagingId,
        variantId,
        lineTotal,
      );

      if (!optimisticLines) {
        return { success: false, error: "Conditionnement introuvable." };
      }

      applyLocalState(optimisticLines);

      return enqueueRpc(async () => {
        const result = await addSlateLine(
          slateId,
          packagingId,
          1,
          lineTotal,
          variantId,
        );

        if (!result.success || !result.line) {
          applyLocalState(
            revertOptimisticAdd(
              linesRef.current,
              packagingId,
              variantId,
            ),
          );
          return {
            success: false,
            error: result.error ?? "Impossible d'ajouter la consommation.",
          };
        }

        applyLocalState(
          reconcileLineFromServer(linesRef.current, result.line),
          result.slateTotal,
        );
        return { success: true };
      });
    },
    [applyLocalState, enqueueRpc, products, slateId],
  );

  const handleQuantityChange = useCallback(
    async (lineId: string, quantity: number): Promise<MutationResult> => {
      const snapshot = linesRef.current;
      const previousLine = snapshot.find((line) => line.id === lineId);

      if (!previousLine) {
        return { success: false, error: "Ligne introuvable." };
      }

      applyLocalState(applyOptimisticQuantity(snapshot, lineId, quantity));

      return enqueueRpc(async () => {
        const result = await updateSlateLineQuantity(slateId, lineId, quantity);

        if (!result.success) {
          applyLocalState(snapshot);
          return {
            success: false,
            error: result.error ?? "Impossible de modifier la quantité.",
          };
        }

        if (result.line) {
          applyLocalState(
            reconcileLineFromServer(linesRef.current, result.line),
            result.slateTotal,
          );
        } else {
          applyLocalState(linesRef.current, result.slateTotal);
        }

        return { success: true };
      });
    },
    [applyLocalState, enqueueRpc, slateId],
  );

  const handleLineTotalChange = useCallback(
    async (lineId: string, lineTotal: number | null): Promise<MutationResult> => {
      const snapshot = linesRef.current;
      const previousLine = snapshot.find((line) => line.id === lineId);

      if (!previousLine) {
        return { success: false, error: "Ligne introuvable." };
      }

      const resolvedLineTotal =
        lineTotal ??
        getCatalogLineTotal(previousLine) ??
        previousLine.lineTotal;

      applyLocalState(
        applyOptimisticLineTotal(snapshot, lineId, resolvedLineTotal),
      );

      return enqueueRpc(async () => {
        const result = await updateSlateLineLineTotal(slateId, lineId, lineTotal);

        if (!result.success || !result.line) {
          applyLocalState(snapshot);
          return {
            success: false,
            error: result.error ?? "Impossible de modifier le prix.",
          };
        }

        applyLocalState(
          reconcileLineFromServer(linesRef.current, result.line),
          result.slateTotal,
        );
        return { success: true };
      });
    },
    [applyLocalState, enqueueRpc, getCatalogLineTotal, slateId],
  );

  const handleRemove = useCallback(
    async (lineId: string): Promise<MutationResult> => {
      const snapshot = linesRef.current;
      const removedLine = snapshot.find((line) => line.id === lineId);

      if (!removedLine) {
        return { success: false, error: "Ligne introuvable." };
      }

      applyLocalState(applyOptimisticRemove(snapshot, lineId));

      return enqueueRpc(async () => {
        const result = await removeSlateLine(slateId, lineId);

        if (!result.success) {
          applyLocalState(snapshot);
          return {
            success: false,
            error: result.error ?? "Impossible de supprimer la ligne.",
          };
        }

        applyLocalState(linesRef.current, result.slateTotal);
        return { success: true };
      });
    },
    [applyLocalState, enqueueRpc, slateId],
  );

  return {
    lines,
    total,
    getCatalogUnitPrice,
    getCatalogLineTotal,
    handleAdd,
    handleQuantityChange,
    handleLineTotalChange,
    handleRemove,
  };
}
