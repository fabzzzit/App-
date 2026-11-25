"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/play", label: "Jugar", icon: "♟" },
  { href: "/learn", label: "Aprender", icon: "🎓" },
  { href: "/games", label: "Partidas", icon: "📜" },
];

export default function Nav() {
  const path = usePathname();
  const active = (href: string) => path === href || path.startsWith(href + "/") || (href === "/games" && path.startsWith("/review"));
  return (
    <>
      <header className="sticky top-0 z-40 border-b border-line bg-[#262522]/95 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-xl text-white">♞</span>
            <span>
              Mentor<span className="text-brand">Chess</span>
            </span>
            <span className="ml-1 rounded bg-panel2 px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted">beta</span>
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={`rounded-lg px-4 py-2 text-sm font-bold transition ${
                  active(l.href) ? "bg-panel2 text-white" : "text-muted hover:bg-panel hover:text-white"
                }`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-3 border-t border-line bg-[#262522]/98 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        {LINKS.map((l) => (
          <Link
            key={l.href}
            href={l.href}
            className={`flex flex-col items-center gap-0.5 py-2 text-[11px] font-bold ${
              active(l.href) ? "text-brand" : "text-muted"
            }`}
          >
            <span className="text-xl leading-none">{l.icon}</span>
            {l.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
