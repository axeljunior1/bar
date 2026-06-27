import { AppShell } from "@/components/layout/AppShell";
import { requireBarSession } from "@/lib/auth/require-bar-session";

type PlaceholderPageProps = {
  title: string;
  message: string;
};

export async function PlaceholderPage({ title, message }: PlaceholderPageProps) {
  const session = await requireBarSession();

  return (
    <AppShell session={session} title={title}>
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
        <p className="text-muted">{message}</p>
      </div>
    </AppShell>
  );
}
