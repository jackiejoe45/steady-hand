"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Home" },
  { href: "/leaderboard", label: "Board" },
  { href: "/profile", label: "Profile" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-800 bg-[#0a0a0f]/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg justify-around py-3">
        {links.map(({ href, label }) => (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              pathname === href
                ? "text-[#4FC3F7]"
                : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
