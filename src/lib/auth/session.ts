import { cache } from "react";

import { createClient } from "@/lib/supabase/server";
import type { BarStatus, Profile } from "@/lib/types/database";
import {
  computePackagingPrice,
  formatCurrency,
} from "@/lib/utils/money";

export { computePackagingPrice, formatCurrency };

export type SessionContext = {
  userId: string;
  profile: Profile;
  barStatus: BarStatus;
};

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
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

  const { data: bar } = await supabase
    .from("bars")
    .select("status")
    .eq("id", profile.bar_id)
    .maybeSingle();

  return {
    userId: user.id,
    profile,
    barStatus: bar?.status ?? "active",
  };
});

export function isOwner(profile: Profile): boolean {
  return profile.role === "owner";
}
