import { AppShell } from "@/components/layout/AppShell";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/auth/session";

export default async function HistoriquePage() {
  const supabase = await createClient();

  const { data: sales } = await supabase
    .from("sales")
    .select("id, total, sold_at, payment_method_id")
    .order("sold_at", { ascending: false })
    .limit(50);

  const { data: paymentMethods } = await supabase
    .from("payment_methods")
    .select("id, name");

  const paymentMethodById = new Map(
    paymentMethods?.map((method) => [method.id, method.name]) ?? [],
  );

  return (
    <AppShell title="Historique">
      {!sales?.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
          <p className="text-muted">Aucune vente enregistrée</p>
        </div>
      ) : (
        <ul className="space-y-3">
          {sales.map((sale) => (
            <li
              key={sale.id}
              className="rounded-3xl border border-border bg-white p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">
                    {formatCurrency(Number(sale.total))}
                  </p>
                  <p className="text-sm text-muted">
                    {new Date(sale.sold_at).toLocaleString("fr-FR")}
                  </p>
                </div>
                <span className="rounded-full bg-surface-muted px-3 py-1 text-sm">
                  {paymentMethodById.get(sale.payment_method_id) ?? "—"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
