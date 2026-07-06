"use client";

import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { useEffect } from "react";

const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

export function AnalyticsProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (key && typeof window !== "undefined") {
      posthog.init(key, {
        api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://app.posthog.com",
        capture_pageview: true,
        persistence: "localStorage",
      });
    }
  }, []);

  if (!key) return <>{children}</>;

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}

export function trackEvent(event: string, properties?: Record<string, unknown>) {
  if (key && typeof window !== "undefined") {
    posthog.capture(event, properties);
  }
}
