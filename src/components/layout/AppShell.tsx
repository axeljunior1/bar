import { BottomNav } from "@/components/layout/BottomNav";
import { AppHeader } from "@/components/layout/AppHeader";
import { isOwner, type SessionContext } from "@/lib/auth/session";

type AppShellProps = {
  session: SessionContext;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function AppShell({
  session,
  title,
  subtitle,
  children,
}: AppShellProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-background">
      <AppHeader title={title} subtitle={subtitle} />
      <main className="flex-1 px-4 py-4 pb-nav">{children}</main>
      <BottomNav isOwner={isOwner(session.profile)} />
    </div>
  );
}
