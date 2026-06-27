import { createClient } from "@/lib/supabase/server";
import type { BarStatus } from "@/lib/types/database";

export type SuperAdminBarListItem = {
  id: string;
  name: string;
  status: BarStatus;
  createdAt: string;
};

export async function loadAllBars(): Promise<SuperAdminBarListItem[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("bars")
    .select("id, name, status, created_at")
    .order("created_at", { ascending: false });

  return (
    data?.map((bar) => ({
      id: bar.id,
      name: bar.name,
      status: bar.status,
      createdAt: bar.created_at,
    })) ?? []
  );
}
