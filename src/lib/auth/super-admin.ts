import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";

import { createClient } from "@/lib/supabase/server";

export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return null;
  }

  return user;
}

export async function isCurrentUserSuperAdmin(): Promise<boolean> {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("is_super_admin");

  if (error) {
    return false;
  }

  return Boolean(data);
}

export async function requireSuperAdmin(): Promise<User> {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isSuperAdmin = await isCurrentUserSuperAdmin();

  if (!isSuperAdmin) {
    redirect("/");
  }

  return user;
}
