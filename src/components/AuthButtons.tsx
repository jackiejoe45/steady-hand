"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn, signOut, signUp, useSession } from "@/lib/auth-client";

interface AuthButtonsProps {
  googleEnabled?: boolean;
  appleEnabled?: boolean;
}

export function AuthButtons({
  googleEnabled: googleEnabledProp,
  appleEnabled: appleEnabledProp,
}: AuthButtonsProps) {
  const { data: session, isPending } = useSession();
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
      .catch(() => {
        // Keep OAuth hidden if config can't be loaded
      });
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
          callbackURL: "/",
        });
        if (result.error) {
          setError(result.error.message ?? "Sign up failed");
          return;
        }
      } else {
        const result = await signIn.email({
          email,
          password,
          callbackURL: "/",
        });
        if (result.error) {
          setError(result.error.message ?? "Sign in failed");
          return;
        }
      }
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
      <div className="flex flex-col gap-4 w-full max-w-xs">
        <form onSubmit={handleEmailAuth} className="flex flex-col gap-3">
          {mode === "sign-up" && (
            <input
              type="text"
              placeholder="Display name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#4FC3F7]"
              autoComplete="name"
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#4FC3F7]"
            autoComplete="email"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            className="w-full rounded-xl bg-zinc-900 border border-zinc-800 px-4 py-3 text-white placeholder:text-zinc-500 focus:outline-none focus:border-[#4FC3F7]"
            autoComplete={
              mode === "sign-up" ? "new-password" : "current-password"
            }
          />
          {error && (
            <p className="text-red-400 text-sm text-center">{error}</p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-[#4FC3F7] hover:bg-[#29B6F6] disabled:opacity-50 text-black py-3 font-medium transition-colors"
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
          className="text-sm text-zinc-500 hover:text-zinc-300"
        >
          {mode === "sign-in"
            ? "Need an account? Sign up"
            : "Already have an account? Sign in"}
        </button>

        {showOAuth && (
          <>
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-zinc-800" />
              <span className="text-xs text-zinc-500 uppercase tracking-wide">
                or
              </span>
              <div className="h-px flex-1 bg-zinc-800" />
            </div>

            {googleEnabled && (
              <button
                type="button"
                onClick={() =>
                  signIn.social({ provider: "google", callbackURL: "/" })
                }
                className="w-full rounded-xl bg-white text-black py-3 font-medium hover:bg-zinc-100 transition-colors"
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
                className="w-full rounded-xl bg-zinc-800 text-white py-3 font-medium hover:bg-zinc-700 transition-colors border border-zinc-700"
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
    <div className="flex items-center gap-3">
      {deferredPrompt && (
        <button
          onClick={async () => {
            await deferredPrompt.prompt();
            setDeferredPrompt(null);
          }}
          className="text-xs text-[#4FC3F7] underline"
        >
          Install App
        </button>
      )}
      <span className="text-sm text-zinc-400">{session.user.name}</span>
      <button
        onClick={() => signOut()}
        className="text-xs text-zinc-500 hover:text-zinc-300"
      >
        Sign out
      </button>
    </div>
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}
