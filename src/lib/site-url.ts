import { headers } from "next/headers";

function normalizeOrigin(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");

  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return `https://${trimmed}`;
}

function getSiteOriginFromEnv(): string | null {
  const candidates = [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
  ];

  for (const candidate of candidates) {
    if (candidate?.trim()) {
      return normalizeOrigin(candidate);
    }
  }

  return null;
}

export function getPasswordResetRedirectUrl(origin: string): string {
  return `${origin}/auth/callback?next=/login/nouveau-mot-de-passe`;
}

export async function getAppOrigin(): Promise<string> {
  const fromEnv = getSiteOriginFromEnv();

  if (fromEnv) {
    return fromEnv;
  }

  const headersList = await headers();
  const host = headersList.get("x-forwarded-host") ?? headersList.get("host");
  const protocol =
    headersList.get("x-forwarded-proto") ??
    (host?.includes("localhost") ? "http" : "https");

  if (host) {
    return normalizeOrigin(`${protocol}://${host}`);
  }

  if (process.env.NODE_ENV !== "production") {
    return "http://localhost:3000";
  }

  throw new Error(
    "URL du site introuvable. Définissez NEXT_PUBLIC_SITE_URL sur Netlify.",
  );
}

export function isLocalhostOrigin(origin: string): boolean {
  try {
    const { hostname } = new URL(origin);
    return hostname === "localhost" || hostname === "127.0.0.1";
  } catch {
    return origin.includes("localhost") || origin.includes("127.0.0.1");
  }
}
