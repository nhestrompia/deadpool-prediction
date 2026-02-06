"use client";

import { GraveyardGrid } from "@/components/graveyard-grid";
import { useDeadWallets } from "@/hooks/useDeadWallets";
import { deadpoolArenaAddress } from "@/lib/arena";

export default function GraveyardPage() {
  const { total, wallets, isLoading } = useDeadWallets();

  return (
    <main className="flex w-full flex-col gap-8">
      {/* Header */}
      <section className="rounded-lg border-2 border-border bg-secondary-background p-8 shadow-shadow text-center">
        <p className="text-xs uppercase tracking-[0.3em]">Wall of Shame</p>
        <h2 className="mt-2 text-4xl font-heading">
          {"\u2620"} The Graveyard {"\u2620"}
        </h2>
        <p className="mt-3 text-sm max-w-md mx-auto">
          Every wallet that fell to three consecutive losses. No appeals. No
          reversals. Just death.
        </p>

        <div className="mt-6 inline-flex items-center gap-3 rounded-full border-2 border-border px-5 py-2">
          <span className="text-xs uppercase tracking-[0.3em]">
            Total Deaths
          </span>
          <span className="text-2xl font-heading">{total.toString()}</span>
        </div>
      </section>

      {/* Content */}
      {!deadpoolArenaAddress ? (
        <p className="rounded-lg border-2 border-border bg-secondary-background px-4 py-3 text-sm">
          Set <strong>NEXT_PUBLIC_DEADPOOL_ARENA_ADDRESS</strong> in
          <span className="font-mono"> frontend/.env</span> to load the
          graveyard.
        </p>
      ) : isLoading ? (
        <section className="rounded-lg border-2 border-border bg-secondary-background p-12 text-center shadow-shadow">
          <p className="text-sm animate-pulse">Digging up graves...</p>
        </section>
      ) : (
        <GraveyardGrid wallets={wallets} />
      )}
    </main>
  );
}
