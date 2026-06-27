import Link from "next/link";

import type { SaleListItem } from "@/lib/sales/queries";
import { formatDateTimeFr } from "@/lib/sales/period";
import { formatCurrency } from "@/lib/utils/money";

type SalesListProps = {
  sales: SaleListItem[];
};

export function SalesList({ sales }: SalesListProps) {
  if (!sales.length) {
    return (
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
        <p className="text-muted">Aucune vente sur cette période</p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {sales.map((sale) => (
        <li key={sale.id}>
          <Link
            href={`/ventes/${sale.id}`}
            className="block rounded-3xl border border-border bg-white p-4 active:bg-surface-muted"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate text-lg font-semibold">{sale.clientName}</p>
                <p className="text-sm text-muted">
                  {formatDateTimeFr(sale.soldAt)}
                </p>
                <p className="mt-1 text-sm text-muted">
                  {sale.paymentMethodName}
                  {sale.lineCount
                    ? ` · ${sale.lineCount} ligne${sale.lineCount > 1 ? "s" : ""}`
                    : ""}
                  {sale.serverName ? ` · ${sale.serverName}` : ""}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-lg font-bold text-brand-700">
                  {formatCurrency(sale.total)}
                </p>
                <p className="text-sm text-brand-600">Voir</p>
              </div>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
