import type { SaleDetail } from "@/lib/sales/queries";
import {
  formatVariantLabel,
  getSlateLinePrimaryLabel,
  getSlateLineSecondaryLabel,
} from "@/lib/products/variant-display";
import { formatCurrency } from "@/lib/utils/money";

type SaleLinesDetailProps = {
  lines: SaleDetail["lines"];
};

export function SaleLinesDetail({ lines }: SaleLinesDetailProps) {
  if (!lines.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
        <p className="text-muted">Aucune ligne enregistrée</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {lines.map((line) => {
        const hasVariant = Boolean(
          formatVariantLabel(line.variantSize, line.variantColor),
        );

        return (
        <li
          key={line.id}
          className="rounded-3xl border border-border bg-white p-4"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold">{getSlateLinePrimaryLabel(line)}</p>
              <p className="text-sm text-muted">
                {getSlateLineSecondaryLabel(line)}
              </p>
              {hasVariant ? (
                <p className="text-sm text-muted">{line.packagingName}</p>
              ) : null}
              <p className="mt-1 text-sm text-muted">
                {line.quantity} × {formatCurrency(line.unitPrice)}
              </p>
            </div>
            <p className="shrink-0 text-lg font-bold text-brand-700">
              {formatCurrency(line.lineTotal)}
            </p>
          </div>
        </li>
        );
      })}
    </ul>
  );
}
