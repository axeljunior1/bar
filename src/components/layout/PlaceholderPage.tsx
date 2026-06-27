import { AppShell } from "@/components/layout/AppShell";

type PlaceholderPageProps = {
  title: string;
  message: string;
};

export function PlaceholderPage({ title, message }: PlaceholderPageProps) {
  return (
    <AppShell title={title}>
      <div className="rounded-3xl border border-dashed border-border bg-white px-4 py-10 text-center">
        <p className="text-muted">{message}</p>
      </div>
    </AppShell>
  );
}
