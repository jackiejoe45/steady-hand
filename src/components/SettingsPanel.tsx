"use client";

import { usePreferences } from "@/components/ThemeProvider";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  onOpenTutorial: () => void;
}

function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-3 rounded-sm border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-left transition-colors hover:border-[var(--border-strong)]"
    >
      <span>
        <span className="block text-sm text-[var(--fg)]">{label}</span>
        <span className="mt-0.5 block text-xs leading-relaxed text-[var(--fg-muted)]">
          {description}
        </span>
      </span>
      <span
        className={`mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors ${
          checked ? "bg-[var(--accent-teal)]" : "bg-[var(--border-strong)]"
        }`}
      >
        <span
          className={`block h-4 w-4 translate-y-0.5 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
    </button>
  );
}

export function SettingsPanel({
  open,
  onClose,
  onOpenTutorial,
}: SettingsPanelProps) {
  const { theme, hardMode, setTheme, setHardMode } = usePreferences();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center">
      <button
        type="button"
        aria-label="Close settings"
        className="absolute inset-0"
        onClick={onClose}
      />
      <div className="relative z-10 w-full max-w-sm animate-fade-up rounded-sm border border-[var(--border)] bg-[var(--bg-elevated)] p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <p className="section-label">Settings</p>
          <button
            type="button"
            onClick={onClose}
            className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            Close
          </button>
        </div>

        <div className="space-y-3">
          <Toggle
            checked={hardMode}
            onChange={setHardMode}
            label="Hard mode"
            description="The angle dial hides a few seconds after targeting begins. Memorize fast."
          />

          <div className="rounded-sm border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
            <p className="text-sm text-[var(--fg)]">Appearance</p>
            <p className="mt-0.5 text-xs text-[var(--fg-muted)]">
              Choose light or dark theme
            </p>
            <div className="mt-3 flex gap-2">
              {(["dark", "light"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTheme(t)}
                  className={`btn-secondary flex-1 py-2 text-[0.7rem] ${
                    theme === t
                      ? "border-[var(--accent-teal)] text-[var(--accent-teal)]"
                      : ""
                  }`}
                >
                  {t === "dark" ? "Dark" : "Light"}
                </button>
              ))}
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenTutorial();
            }}
            className="btn-secondary w-full py-2.5"
          >
            How to play
          </button>
        </div>
      </div>
    </div>
  );
}
