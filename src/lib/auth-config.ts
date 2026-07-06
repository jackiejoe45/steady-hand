const LOCAL_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"];

const PRODUCTION_HOSTS = [
  "steady-hand-one.vercel.app",
  "*.vercel.app",
];

const PRODUCTION_ORIGINS = [
  "https://steady-hand-one.vercel.app",
  "https://*.vercel.app",
];

const DEV_TUNNEL_ORIGINS = [
  "https://*.ngrok-free.dev",
  "https://*.ngrok.io",
];

function addUrlOrigin(set: Set<string>, value: string | undefined) {
  if (!value) return;
  try {
    set.add(new URL(value).origin);
  } catch {
    // ignore invalid URLs
  }
}

/** Dynamic base URL — resolves cookies/callbacks from the incoming request host */
export function getAuthBaseURLConfig() {
  const fallback =
    process.env.BETTER_AUTH_URL ??
    process.env.NEXT_PUBLIC_SITE_URL ??
    "http://localhost:3000";

  return {
    fallback: fallback.replace(/\/$/, ""),
    protocol: "auto" as const,
    allowedHosts: [
      "localhost:3000",
      "127.0.0.1:3000",
      ...PRODUCTION_HOSTS,
      "*.ngrok-free.dev",
      "*.ngrok.io",
    ],
  };
}

/** Origins allowed for Better Auth callbacks / CSRF checks */
export function getTrustedOrigins(): string[] {
  const origins = new Set<string>([
    ...LOCAL_ORIGINS,
    ...PRODUCTION_ORIGINS,
    ...DEV_TUNNEL_ORIGINS,
  ]);

  addUrlOrigin(origins, process.env.BETTER_AUTH_URL);
  addUrlOrigin(origins, process.env.NEXT_PUBLIC_SITE_URL);

  if (process.env.VERCEL_URL) {
    addUrlOrigin(origins, `https://${process.env.VERCEL_URL}`);
  }
  if (process.env.VERCEL_BRANCH_URL) {
    addUrlOrigin(origins, `https://${process.env.VERCEL_BRANCH_URL}`);
  }

  return [...origins];
}

export function getAppOrigins(): string[] {
  return getTrustedOrigins();
}

/** SSR fallback only — browser uses window.location.origin */
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

export function getAuthClientBaseURL(): string {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return getAuthBaseURL();
}

export function isBetterAuthInfraEnabled(): boolean {
  return Boolean(
    process.env.BETTER_AUTH_API_KEY &&
      process.env.BETTER_AUTH_KV_URL &&
      process.env.BETTER_AUTH_API_URL,
  );
}
