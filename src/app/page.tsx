import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/server";
import { getSessionContext } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/auth/session";

export default async function HomePage() {
  const session = await getSessionContext();
  const supabase = await createClient();

  const { data: bar } = await supabase
    .from("bars")
    .select("name")
    .single();

  const { data: openSlates } = await supabase
    .from("slates")
    .select("id, client_name, total, note")
    .eq("status", "open")
    .order("updated_at", { ascending: false });

  return (
    <AppShell title="Ardoises" subtitle={bar?.name ?? session?.profile.full_name ?? undefined}>
      <div className="flex flex-col gap-4">
        <Link href="/ardoises/nouvelle">
          <Button>Nouvelle ardoise</Button>
        </Link>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
            Ouvertes ({openSlates?.length ?? 0})
          </h2>

          {!openSlates?.length ? (
            <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
              <p className="text-muted">Aucune ardoise ouverte</p>
            </div>
          ) : (
            <ul className="space-y-3">
              {openSlates.map((slate) => (
                <li key={slate.id}>
                  <Link
                    href={`/ardoises/${slate.id}`}
                    className="block rounded-3xl border border-border bg-white p-4 active:bg-surface-muted"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">
                          {slate.client_name}
                        </p>
                        {slate.note ? (
                          <p className="truncate text-sm text-muted">
                            {slate.note}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-lg font-bold text-brand-700">
                        {formatCurrency(Number(slate.total))}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </AppShell>
  );
}
