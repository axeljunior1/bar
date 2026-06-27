import { AppShell } from "@/components/layout/AppShell";
import { SalesList } from "@/components/sales/SalesList";
import { SalesPeriodFilter } from "@/components/sales/SalesPeriodFilter";
import { SalesSummaryCard } from "@/components/sales/SalesSummaryCard";
import { requireBarSession } from "@/lib/auth/require-bar-session";
import { loadSalesList } from "@/lib/sales/queries";
import { parseSalesPeriod } from "@/lib/sales/period";

type VentesPageProps = {
  searchParams: Promise<{ period?: string }>;
};

export default async function VentesPage({ searchParams }: VentesPageProps) {
  const session = await requireBarSession();
  const { period: periodParam } = await searchParams;
  const period = parseSalesPeriod(periodParam);
  const { sales, summary } = await loadSalesList(
    session.profile.bar_id,
    period,
  );

  return (
    <AppShell session={session} title="Ventes">
      <div className="flex flex-col gap-4">
        <SalesPeriodFilter activePeriod={period} />
        <SalesSummaryCard
          period={period}
          total={summary.total}
          count={summary.count}
          breakdown={summary.breakdown}
        />
        <SalesList sales={sales} />
      </div>
    </AppShell>
  );
}
