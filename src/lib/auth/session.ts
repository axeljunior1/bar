import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";

export type SessionContext = {
  userId: string;
  profile: Profile;
};

export async function getSessionContext(): Promise<SessionContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .eq("actif", true)
    .single();

  if (profileError || !profile) {
    return null;
  }

  return { userId: user.id, profile };
}

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}

export function formatCurrency(amount: number, currency = "EUR"): string {
  return new Intl.NumberFormat("fr-FR", {
    style: "currency",
    currency,
  }).format(amount);
}

export function computePackagingPrice(
  unitPrice: number,
  quantity: number,
  optionalPrice: number | null,
): number {
  return optionalPrice ?? unitPrice * quantity;
}
