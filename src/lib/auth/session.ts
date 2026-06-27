import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/database";
import {
  computePackagingPrice,
  formatCurrency,
} from "@/lib/utils/money";

export { computePackagingPrice, formatCurrency };

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
