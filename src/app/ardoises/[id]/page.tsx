import { PlaceholderPage } from "@/components/layout/PlaceholderPage";

type ArdoiseDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ArdoiseDetailPage({ params }: ArdoiseDetailPageProps) {
  const { id } = await params;

  return (
    <PlaceholderPage
      title="Ardoise"
      message={`Détail ardoise ${id} — prochaine étape de développement.`}
    />
  );
}
