import { AppShell } from "@/components/layout/AppShell";
import { KitchenQueue } from "@/components/kitchen/KitchenQueue";
import { KitchenServedHistory } from "@/components/kitchen/KitchenServedHistory";
import { requireBarSession } from "@/lib/auth/require-bar-session";
import {
  loadPendingKitchenItems,
  loadServedKitchenItems,
} from "@/lib/kitchen/queries";

export default async function CuisinePage() {
  const session = await requireBarSession();
  const barId = session.profile.bar_id;

  const [pendingItems, servedItems] = await Promise.all([
    loadPendingKitchenItems(barId),
    loadServedKitchenItems(barId),
  ]);

  return (
    <AppShell title="Cuisine">
      <p className="mb-4 text-sm text-muted">
        {pendingItems.length} commande{pendingItems.length > 1 ? "s" : ""} en
        attente
      </p>
      <KitchenQueue items={pendingItems} />
      <KitchenServedHistory items={servedItems} />
    </AppShell>
  );
}
