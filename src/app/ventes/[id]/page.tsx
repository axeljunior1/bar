import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { SaleLinesDetail } from "@/components/sales/SaleLinesDetail";
import { requireBarSession } from "@/lib/auth/require-bar-session";
import { loadSaleDetail } from "@/lib/sales/queries";
import { formatDateTimeFr } from "@/lib/sales/period";
import { formatCurrency } from "@/lib/utils/money";

type VenteDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function VenteDetailPage({ params }: VenteDetailPageProps) {
  const { id } = await params;
  const session = await requireBarSession();
  const sale = await loadSaleDetail(id, session.profile.bar_id);

  if (!sale) {
    notFound();
  }

  return (
    <AppShell session={session} title="Détail vente" subtitle={sale.clientName}>
      <BackLink href="/ventes" label="Ventes" />

      <div className="mb-6 rounded-3xl border border-border bg-white p-4">
        <p className="text-sm text-muted">Total encaissé</p>
        <p className="text-3xl font-bold text-brand-700">
          {formatCurrency(sale.total)}
        </p>
      </div>

      <dl className="mb-6 space-y-3 rounded-3xl border border-border bg-white p-4 text-sm">
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Client / groupe</dt>
          <dd className="font-medium text-right">{sale.clientName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Date</dt>
          <dd className="font-medium text-right">
            {formatDateTimeFr(sale.soldAt)}
          </dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Paiement</dt>
          <dd className="font-medium text-right">{sale.paymentMethodName}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt className="text-muted">Statut</dt>
          <dd className="font-medium text-right">{sale.statusLabel}</dd>
        </div>
        {sale.serverName ? (
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Serveur</dt>
            <dd className="font-medium text-right">{sale.serverName}</dd>
          </div>
        ) : null}
      </dl>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Produits vendus</h2>
        <SaleLinesDetail lines={sale.lines} />
      </section>
    </AppShell>
  );
}
