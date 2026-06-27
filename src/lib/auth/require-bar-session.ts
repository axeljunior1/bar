import { redirect } from "next/navigation";

import { isCurrentUserSuperAdmin } from "@/lib/auth/super-admin";
import { getSessionContext } from "@/lib/auth/session";
import type { SessionContext } from "@/lib/auth/session";

export async function requireBarSession(): Promise<SessionContext> {
  const session = await getSessionContext();

  if (!session) {
    redirect("/login");
  }

  if (session.barStatus === "suspended") {
    const isSuperAdmin = await isCurrentUserSuperAdmin();

    if (!isSuperAdmin) {
      redirect("/suspended");
    }
  }

  return session;
}
