import { createClient } from "@/lib/supabase/server";

export type KitchenQueueItem = {
  id: string;
  clientName: string;
  location: string | null;
  note: string | null;
  productName: string;
  variantSize: string | null;
  variantColor: string | null;
  packagingName: string | null;
  quantity: number;
  createdAt: string;
};

export type KitchenServedItem = KitchenQueueItem & {
  servedAt: string;
};

function mapKitchenRow(item: {
  id: string;
  client_name_snapshot: string;
  location_snapshot: string | null;
  note_snapshot: string | null;
  product_name_snapshot: string;
  variant_size_snapshot: string | null;
  variant_color_snapshot: string | null;
  packaging_name_snapshot: string | null;
  quantity: number;
  created_at: string;
}): KitchenQueueItem {
  return {
    id: item.id,
    clientName: item.client_name_snapshot,
    location: item.location_snapshot,
    note: item.note_snapshot,
    productName: item.product_name_snapshot,
    variantSize: item.variant_size_snapshot,
    variantColor: item.variant_color_snapshot,
    packagingName: item.packaging_name_snapshot,
    quantity: Number(item.quantity),
    createdAt: item.created_at,
  };
}

function getTodayStartIso(): string {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

export async function loadPendingKitchenItems(
  barId: string,
): Promise<KitchenQueueItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("kitchen_items")
    .select(
      "id, client_name_snapshot, location_snapshot, note_snapshot, product_name_snapshot, variant_size_snapshot, variant_color_snapshot, packaging_name_snapshot, quantity, created_at",
    )
    .eq("bar_id", barId)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return data?.map(mapKitchenRow) ?? [];
}

export async function loadServedKitchenItems(
  barId: string,
): Promise<KitchenServedItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("kitchen_items")
    .select(
      "id, client_name_snapshot, location_snapshot, note_snapshot, product_name_snapshot, variant_size_snapshot, variant_color_snapshot, packaging_name_snapshot, quantity, created_at, served_at",
    )
    .eq("bar_id", barId)
    .eq("status", "served")
    .gte("served_at", getTodayStartIso())
    .order("served_at", { ascending: false });

  return (
    data?.map((item) => ({
      ...mapKitchenRow(item),
      servedAt: item.served_at ?? item.created_at,
    })) ?? []
  );
}
