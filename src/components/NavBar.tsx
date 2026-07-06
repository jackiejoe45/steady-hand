"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Play" },
  { href: "/leaderboard", label: "Board" },
  { href: "/profile", label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="shrink-0 border-t border-[var(--border)] bg-[var(--bg)]/95 backdrop-blur-sm pb-[max(0.5rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-lg justify-around py-2.5">
        {links.map(({ href, label }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`px-4 py-1.5 text-[0.7rem] font-medium tracking-[0.16em] uppercase transition-colors ${
                active
                  ? "text-[var(--accent-teal)]"
                  : "text-[var(--fg-subtle)] hover:text-[var(--fg-muted)]"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
