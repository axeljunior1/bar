import Link from "next/link";

type SuperAdminShellProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export function SuperAdminShell({
  title,
  subtitle,
  children,
}: SuperAdminShellProps) {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-background">
      <header className="border-b border-border bg-white px-4 py-4">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700">
          Super Admin
        </p>
        <h1 className="text-2xl font-bold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
        <nav className="mt-4 flex flex-wrap gap-2 text-sm">
          <Link
            href="/super-admin"
            className="rounded-full bg-surface-muted px-3 py-1 font-medium text-foreground"
          >
            Accueil
          </Link>
          <Link
            href="/super-admin/bars"
            className="rounded-full bg-surface-muted px-3 py-1 font-medium text-foreground"
          >
            Bars
          </Link>
          <Link
            href="/"
            className="rounded-full bg-surface-muted px-3 py-1 font-medium text-muted"
          >
            App bar
          </Link>
        </nav>
      </header>
      <main className="flex-1 px-4 py-4 pb-8">{children}</main>
    </div>
  );
}
