"use client";

import { SlateAddConsumption } from "@/components/slates/SlateAddConsumption";
import { SlateDetailActions } from "@/components/slates/SlateDetailActions";
import { SlateLinesList } from "@/components/slates/SlateLinesList";
import type {
  PaymentMethodOption,
  SellableCategory,
  SellableProduct,
  SlateLineItem,
} from "@/components/slates/types";
import { useSlateLineMutations } from "@/lib/slates/use-slate-line-mutations";
import { formatCurrency } from "@/lib/utils/money";

type SlateDetailClientProps = {
  slateId: string;
  clientName: string;
  initialLines: SlateLineItem[];
  initialTotal: number;
  categories: SellableCategory[];
  products: SellableProduct[];
  paymentMethods: PaymentMethodOption[];
};

export function SlateDetailClient({
  slateId,
  clientName,
  initialLines,
  initialTotal,
  categories,
  products,
  paymentMethods,
}: SlateDetailClientProps) {
  const {
    lines,
    total,
    getCatalogLineTotal,
    handleAdd,
    handleQuantityChange,
    handleLineTotalChange,
    handleRemove,
  } = useSlateLineMutations({
    slateId,
    products,
    initialLines,
    initialTotal,
  });

  return (
    <>
      <div className="mb-6 rounded-3xl border border-border bg-white p-4">
        <p className="text-sm text-muted">Total actuel</p>
        <p className="text-3xl font-bold text-brand-700">{formatCurrency(total)}</p>
      </div>

      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Consommations</h2>
        <SlateLinesList
          lines={lines}
          getCatalogLineTotal={getCatalogLineTotal}
          onQuantityChange={handleQuantityChange}
          onLineTotalChange={handleLineTotalChange}
          onRemove={handleRemove}
        />
      </section>

      <div className="mb-28">
        <SlateAddConsumption
          categories={categories}
          products={products}
          onAdd={handleAdd}
        />
      </div>

      <SlateDetailActions
        slateId={slateId}
        clientName={clientName}
        lines={lines}
        total={total}
        paymentMethods={paymentMethods}
      />
    </>
  );
}
