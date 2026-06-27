import type { PaymentBreakdownItem } from "@/lib/sales/queries";
import { getPeriodLabel, type SalesPeriod } from "@/lib/sales/period";
import { formatCurrency } from "@/lib/utils/money";

type SalesSummaryCardProps = {
  period: SalesPeriod;
  total: number;
  count: number;
  breakdown: PaymentBreakdownItem[];
};

export function SalesSummaryCard({
  period,
  total,
  count,
  breakdown,
}: SalesSummaryCardProps) {
  return (
    <section className="rounded-3xl border border-border bg-white p-4">
      <p className="text-sm font-medium text-muted">{getPeriodLabel(period)}</p>
      <p className="mt-2 text-3xl font-bold text-brand-700">
        {formatCurrency(total)}
      </p>
      <p className="mt-1 text-sm text-muted">
        {count} vente{count > 1 ? "s" : ""}
      </p>

      {breakdown.length ? (
        <ul className="mt-4 space-y-2 border-t border-border pt-4">
          {breakdown.map((item) => (
            <li
              key={item.name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-muted">{item.name}</span>
              <span className="font-medium">{formatCurrency(item.total)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
