export function PageLoadingSkeleton() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col bg-background px-4 py-4 pb-nav">
      <div className="mb-6 h-8 w-40 animate-pulse rounded-2xl bg-surface-muted" />
      <div className="mb-4 h-14 animate-pulse rounded-3xl bg-surface-muted" />
      <div className="space-y-3">
        <div className="h-28 animate-pulse rounded-3xl bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-surface-muted" />
        <div className="h-28 animate-pulse rounded-3xl bg-surface-muted" />
      </div>
    </div>
  );
}
