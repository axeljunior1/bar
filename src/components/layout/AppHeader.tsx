import { signOut } from "@/lib/actions/auth";

type AppHeaderProps = {
  title: string;
  subtitle?: string;
};

export function AppHeader({ title, subtitle }: AppHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-lg items-center justify-between gap-3 px-4 py-4">
        <div className="min-w-0">
          <h1 className="truncate text-xl font-semibold text-foreground">
            {title}
          </h1>
          {subtitle ? (
            <p className="truncate text-sm text-muted">{subtitle}</p>
          ) : null}
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="min-h-11 rounded-xl px-3 text-sm font-medium text-muted active:bg-surface-muted"
          >
            Quitter
          </button>
        </form>
      </div>
    </header>
  );
}
