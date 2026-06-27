import Link from "next/link";

import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { requireBarSession } from "@/lib/auth/require-bar-session";
import { createClient } from "@/lib/supabase/server";
import { formatCurrency } from "@/lib/utils/money";

function formatOpenedAt(value: string) {
  return new Intl.DateTimeFormat("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function HomePage() {
  const session = await requireBarSession();
  const supabase = await createClient();
  const barId = session.profile.bar_id;

  const [{ data: bar }, { data: openSlates }] = await Promise.all([
    supabase.from("bars").select("name").eq("id", barId).single(),
    supabase
      .from("slates")
      .select("id, client_name, total, note, created_at")
      .eq("bar_id", barId)
      .eq("status", "open")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <AppShell
      session={session}
      title="Ardoises"
      subtitle={bar?.name ?? session.profile.full_name ?? undefined}
    >
      <div className="flex flex-col gap-4">
        <Link href="/ardoises/new">
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
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-lg font-semibold">
                          {slate.client_name}
                        </p>
                        {slate.note ? (
                          <p className="truncate text-sm text-muted">
                            {slate.note}
                          </p>
                        ) : null}
                        <p className="mt-1 text-sm text-muted">
                          Ouverte à {formatOpenedAt(slate.created_at)}
                        </p>
                      </div>
                      <p className="shrink-0 text-lg font-bold text-brand-700">
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
