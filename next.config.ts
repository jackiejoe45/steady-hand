import type { NextConfig } from "next";
import withSerwistInit from "@serwist/next";

const withSerwist = withSerwistInit({
  swSrc: "src/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
});

function getAllowedDevOrigins(): string[] {
  const origins = new Set<string>();
  for (const envVar of [
    process.env.NEXT_PUBLIC_SITE_URL,
    process.env.BETTER_AUTH_URL,
  ]) {
    if (!envVar) continue;
    try {
      origins.add(new URL(envVar).hostname);
    } catch {
      // ignore invalid URLs
    }
  }
  return [...origins];
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
