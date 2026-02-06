"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "./custom-connect-button";

const navItems = [
  { href: "/", label: "Arena" },
  { href: "/wallet", label: "Wallet" },
  { href: "/graveyard", label: "Graveyard" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="flex w-full flex-col items-start justify-between gap-4 rounded-lg border-2 border-border bg-secondary-background/80 px-3 py-4 shadow-shadow backdrop-blur sm:flex-row sm:items-center sm:px-6">
      <div>
        <p className="text-[0.65rem] uppercase tracking-[0.3em] sm:text-xs">
          Deadpool
        </p>
        <h1 className="text-xl font-heading sm:text-2xl">
          ETH Prediction Arena
        </h1>
      </div>
      <nav className="flex w-full flex-wrap items-center gap-3 text-xs sm:w-auto sm:justify-end sm:text-sm">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={
                isActive
                  ? "font-semibold underline"
                  : "underline-offset-4 hover:underline"
              }
            >
              {item.label}
            </Link>
          );
        })}
        <div className="w-full sm:w-auto">
          <ConnectButton />
        </div>
      </nav>
    </header>
  );
}
