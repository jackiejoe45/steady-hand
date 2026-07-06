const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

/** Production deployments — add custom domains here too */
const PRODUCTION_ORIGINS = ["https://steady-hand-one.vercel.app"];

function addUrlOrigin(set: Set<string>, value: string | undefined) {
  if (!value) return;
  try {
    set.add(new URL(value).origin);
  } catch {
    // ignore invalid URLs
  }
}

function addHostnameOrigin(set: Set<string>, hostname: string | undefined) {
  if (!hostname) return;
  addUrlOrigin(set, `https://${hostname}`);
}

/** All app origins used for Better Auth + dev CORS */
export function getAppOrigins(): string[] {
  const origins = new Set<string>([...LOCAL_ORIGINS, ...PRODUCTION_ORIGINS]);

  addUrlOrigin(origins, process.env.BETTER_AUTH_URL);
  addUrlOrigin(origins, process.env.NEXT_PUBLIC_SITE_URL);
  addHostnameOrigin(origins, process.env.VERCEL_URL);
  addHostnameOrigin(origins, process.env.VERCEL_BRANCH_URL);

  return [...origins];
}

/** Origins allowed for Better Auth callbacks / cross-origin checks */
export function getTrustedOrigins(): string[] {
  return getAppOrigins();
}

/** Server-side Better Auth base URL */
export function getAuthBaseURL(): string {
  if (process.env.BETTER_AUTH_URL) {
    return process.env.BETTER_AUTH_URL.replace(/\/$/, "");
  }
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return "http://localhost:3000";
}

export function getOAuthProviders() {
  return {
    google: Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    ),
    apple: Boolean(
      process.env.APPLE_CLIENT_ID && process.env.APPLE_CLIENT_SECRET,
    ),
  };
}

/** Browser: same origin as the page. SSR: env fallback. */
export function getAuthClientBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getAuthBaseURL();
}
