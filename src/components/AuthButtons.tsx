"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";

interface AuthButtonsProps {
  googleEnabled?: boolean;
  appleEnabled?: boolean;
}

export function AuthButtons({
  googleEnabled: googleEnabledProp,
  appleEnabled: appleEnabledProp,
}: AuthButtonsProps) {
  const router = useRouter();
  const { data: session, isPending, refetch } = useSession();
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleEnabled, setGoogleEnabled] = useState(
    googleEnabledProp ?? false,
  );
  const [appleEnabled, setAppleEnabled] = useState(appleEnabledProp ?? false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  useEffect(() => {
    if (
      googleEnabledProp !== undefined &&
      appleEnabledProp !== undefined
    ) {
      return;
    }

    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((data: { google?: boolean; apple?: boolean }) => {
        if (googleEnabledProp === undefined) {
          setGoogleEnabled(Boolean(data.google));
        }
        if (appleEnabledProp === undefined) {
          setAppleEnabled(Boolean(data.apple));
        }
      })
      .catch(() => {});
  }, [googleEnabledProp, appleEnabledProp]);

  const handleEmailAuth = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "sign-up") {
        const result = await signUp.email({
          email,
          password,
          name: name.trim() || email.split("@")[0] || "Player",
          callbackURL: window.location.origin + "/",
        });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed");
          return;
        }
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: window.location.origin + "/",
        });
        if (result.error) {
          setError(result.error.message ?? "Sign in failed");
          return;
        }
      }

      await refetch();
      router.refresh();
      router.push("/");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (isPending) return null;

  if (!session) {
    const showOAuth = googleEnabled || appleEnabled;

    return (
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-2.5">
          {mode === "sign-up" && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="input-field w-full rounded-sm px-4 py-2.5 text-sm"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="input-field w-full rounded-sm px-4 py-2.5 text-sm"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="input-field w-full rounded-sm px-4 py-2.5 text-sm"
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
          />
          {error && (
            <p className="text-[var(--danger)] text-xs text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-2.5 disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "sign-in" ? "sign-up" : "sign-in");
            setError("");
          }}
          className="text-xs text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        {showOAuth && (
          <>
            <div className="editorial-rule" />
            {googleEnabled && (
              <button
                type="button"
                onClick={() =>
                  signIn.social({ provider: "google", callbackURL: "/" })
                }
                className="btn-secondary w-full py-2.5"
              >
                Continue with Google
              </button>
            )}
            {appleEnabled && (
              <button
                type="button"
                onClick={() =>
                  signIn.social({ provider: "apple", callbackURL: "/" })
                }
                className="btn-secondary w-full py-2.5"
              >
                Continue with Apple
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 text-xs">
      {deferredPrompt && (
        <button
          onClick={async () => {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
          className="text-[var(--accent-teal)] underline"
        >
          Install app
        </button>
      )}
      <span className="text-[var(--fg-muted)]">{session.user.name}</span>
      <button
        onClick={() => signOut()}
        className="text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
      >
        Sign out
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
