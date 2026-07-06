import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

function getAllowedDevOrigins(): string[] {
  const hostnames = new Set<string>(["steady-hand-one.vercel.app"]);
  for (const envVar of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
    process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : undefined,
  ]) {
    if (!envVar) continue;
    try {
      hostnames.add(new URL(envVar).hostname);
    } catch {
      // ignore invalid URLs
    }
  }
  return [...hostnames];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {},
  allowedDevOrigins: getAllowedDevOrigins(),
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          {
            key: "Permissions-Policy",
            value: "accelerometer=*, gyroscope=*, magnetometer=*",
          },
        ],
      },
    ];
  },
};

export default withSerwist(nextConfig);
