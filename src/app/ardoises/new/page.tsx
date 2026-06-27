import { AppShell } from "@/components/layout/AppShell";
import { BackLink } from "@/components/layout/BackLink";
import { CreateSlateForm } from "@/components/slates/CreateSlateForm";
import { requireBarSession } from "@/lib/auth/require-bar-session";

export default async function NewSlatePage() {
  await requireBarSession();

  return (
    <AppShell title="Nouvelle ardoise">
      <BackLink href="/" label="Ardoises" />
      <CreateSlateForm />
    </AppShell>
  );
}
