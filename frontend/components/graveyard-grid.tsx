import { TombstoneCard } from "@/components/tombstone-card";

export function GraveyardGrid({ wallets }: { wallets: string[] }) {
  if (wallets.length === 0) {
    return (
      <section className="rounded-lg border-2 border-border bg-secondary-background p-6 text-center shadow-shadow sm:p-12">
        <div className="mb-4 text-4xl select-none sm:text-5xl">
          {"\u{1F3DC}\uFE0F"}
        </div>
        <p className="text-lg font-heading">The arena is quiet... for now.</p>
        <p className="mt-2 text-sm">
          No wallets have died yet. Place your bets wisely — or don{"'"}t.
        </p>
      </section>
    );
  }

  return (
    <>
      <section className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {wallets.map((addr, i) => (
          <TombstoneCard key={addr} address={addr} index={i} />
        ))}
      </section>

      <p className="text-center text-xs uppercase tracking-[0.3em] pb-4">
        {wallets.length === 1
          ? "1 soul claimed"
          : `${wallets.length} souls claimed`}{" "}
        — who{"'"}s next?
      </p>
    </>
  );
}
