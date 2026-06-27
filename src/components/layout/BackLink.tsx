import Link from "next/link";

type BackLinkProps = {
  href: string;
  label?: string;
};

export function BackLink({ href, label = "Retour" }: BackLinkProps) {
  return (
    <Link
      href={href}
      className="mb-4 inline-flex min-h-11 items-center text-sm font-medium text-brand-600 active:opacity-70"
    >
      ← {label}
    </Link>
  );
}
