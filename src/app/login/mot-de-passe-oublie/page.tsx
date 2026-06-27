import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

type ForgotPasswordPageProps = {
  searchParams: Promise<{ error?: string }>;
};

export default async function ForgotPasswordPage({
  searchParams,
}: ForgotPasswordPageProps) {
  const { error } = await searchParams;
  const initialError =
    error === "lien"
      ? "Le lien est invalide ou expiré. Demandez-en un nouveau."
      : null;

  return (
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col justify-center px-4 py-8">
      <div className="mb-10 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-600 text-2xl text-white">
          🔑
        </div>
        <h1 className="text-2xl font-bold text-foreground">Mot de passe oublié</h1>
        <p className="mt-2 text-muted">Réinitialisation du compte</p>
      </div>
      <ForgotPasswordForm initialError={initialError} />
    </div>
  );
}
