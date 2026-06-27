import { signOut } from "@/lib/actions/auth";
import { Button } from "@/components/ui/Button";

export default function SuspendedPage() {
  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-8">
      <div className="rounded-3xl border border-border bg-white p-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-amber-100 text-2xl">
          ⏸️
        </div>
        <h1 className="text-2xl font-bold">Accès suspendu</h1>
        <p className="mt-3 text-muted">
          Votre établissement est temporairement suspendu. Contactez
          l&apos;administrateur BarManager pour plus d&apos;informations.
        </p>

        <form action={signOut} className="mt-6">
          <Button type="submit" variant="secondary">
            Se déconnecter
          </Button>
        </form>
      </div>
    </div>
  );
}
