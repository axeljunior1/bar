import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { getSessionContext, isOwner } from "@/lib/auth/session";

type AppShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export async function AppShell({ title, subtitle, children }: AppShellProps) {
  const session = await getSessionContext();

  if (!session) {
    return null;
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-background">
      <AppHeader title={title} subtitle={subtitle} />
      <main className="flex-1 px-4 py-4 pb-nav">{children}</main>
      <BottomNav isOwner={isOwner(session.profile)} />
    </div>
  );
}
