import { notFound } from "next/navigation";

import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { SlateAddConsumption } from "@/components/slates/SlateAddConsumption";
import { EditSlateForm } from "@/components/slates/EditSlateForm";
import { SlateDetailActions } from "@/components/slates/SlateDetailActions";
import { SlateLinesList } from "@/components/slates/SlateLinesList";
import { requireBarSession } from "@/lib/auth/require-bar-session";
import {
  loadPaymentMethods,
  loadSellableCatalog,
  loadSlateLines,
} from "@/lib/slates/catalog";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/money";

type SlateDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function SlateDetailPage({ params }: SlateDetailPageProps) {
  const { id } = await params;
  const session = await requireBarSession();
  const barId = session.profile.bar_id;
  const supabase = await createClient();

  const [
    { data: slate },
    { categories, products },
    lines,
    paymentMethods,
  ] = await Promise.all([
    supabase
      .from("slates")
      .select("id, client_name, location, note, status, total, created_at")
      .eq("id", id)
      .eq("bar_id", barId)
      .maybeSingle(),
    loadSellableCatalog(barId),
    loadSlateLines(id, barId),
    loadPaymentMethods(barId),
  ]);

  if (!slate) {
    notFound();
  }

  const isOpen = slate.status === "open";

  return (
    <AppShell
      session={session}
      title={slate.client_name}
      subtitle={[slate.location, slate.note].filter(Boolean).join(" · ") || undefined}
    >
      <BackLink href="/" label="Ardoises" />

      {slate.status === "paid" ? (
        <p className="mb-4 rounded-2xl bg-green-50 px-4 py-3 text-sm text-green-800">
          Ardoise encaissée.
        </p>
      ) : null}

      {slate.status === "cancelled" ? (
        <p className="mb-4 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Ardoise annulée.
        </p>
      ) : null}

      <div className="mb-6 rounded-3xl border border-border bg-white p-4">
        <p className="text-sm text-muted">Total actuel</p>
        <p className="text-3xl font-bold text-brand-700">
          {formatCurrency(Number(slate.total))}
        </p>
      </div>

      {isOpen ? (
        <section className="mb-8">
          <h2 className="mb-4 text-lg font-semibold">Informations</h2>
          <EditSlateForm
            slateId={slate.id}
            clientName={slate.client_name}
            location={slate.location}
            note={slate.note}
          />
        </section>
      ) : null}

      <section className="mb-8 space-y-4">
        <h2 className="text-lg font-semibold">Consommations</h2>
        <SlateLinesList slateId={slate.id} lines={lines} readOnly={!isOpen} />
      </section>

      {isOpen ? (
        <>
          <div className="mb-28">
            <SlateAddConsumption
              slateId={slate.id}
              categories={categories}
              products={products}
            />
          </div>

          <SlateDetailActions
            slateId={slate.id}
            clientName={slate.client_name}
            lines={lines}
            total={Number(slate.total)}
            paymentMethods={paymentMethods}
          />
        </>
      ) : null}
    </AppShell>
  );
}
