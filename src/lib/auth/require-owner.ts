import { redirect } from "next/navigation";

import { getSessionContext, isOwner } from "@/lib/auth/session";
import type { SessionContext } from "@/lib/auth/session";

export async function requireOwnerPage(): Promise<SessionContext> {
  const session = await getSessionContext();

  if (!session || !isOwner(session.profile)) {
    redirect("/");
  }

  return session;
}

export async function requireOwnerAction(): Promise<
  | { ok: true; session: SessionContext }
  | { ok: false; error: string }
> {
  const session = await getSessionContext();

  if (!session || !isOwner(session.profile)) {
    return { ok: false, error: "Accès non autorisé." };
  }

  return { ok: true, session };
}
