import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { CreateSlateForm } from "@/components/slates/CreateSlateForm";
import { requireBarSession } from "@/lib/auth/require-bar-session";

export default async function NewSlatePage() {
  const session = await requireBarSession();

  return (
    <AppShell session={session} title="Nouvelle ardoise">
      <BackLink href="/" label="Ardoises" />
      <CreateSlateForm />
    </AppShell>
  );
}
