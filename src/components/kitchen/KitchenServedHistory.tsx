import type { KitchenServedItem } from "@/lib/kitchen/queries";
import { formatTimeFr } from "@/lib/sales/period";

type KitchenServedHistoryProps = {
  items: KitchenServedItem[];
};

export function KitchenServedHistory({ items }: KitchenServedHistoryProps) {
  return (
    <section className="mt-10">
      <h2 className="mb-1 text-lg font-semibold">Servis aujourd&apos;hui</h2>
      <p className="mb-4 text-sm text-muted">
        {items.length} élément{items.length > 1 ? "s" : ""}
      </p>

      {!items.length ? (
        <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-8 text-center">
          <p className="text-sm text-muted">Aucun élément servi pour le moment</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {items.map((item) => (
            <li
              key={item.id}
              className="rounded-2xl border border-border bg-surface-muted px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.clientName}</p>
                  <p className="truncate text-sm text-muted">
                    {item.quantity > 1 ? `${item.quantity} × ` : ""}
                    {item.productName}
                    {item.packagingName ? ` · ${item.packagingName}` : ""}
                  </p>
                  {item.location ? (
                    <p className="truncate text-xs text-muted">{item.location}</p>
                  ) : null}
                </div>
                <div className="shrink-0 text-right text-sm text-muted">
                  <p>Servi {formatTimeFr(item.servedAt)}</p>
                  <p className="text-xs">Reçu {formatTimeFr(item.createdAt)}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
