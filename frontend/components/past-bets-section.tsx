import { formatEther } from "viem";

import type { PastBet } from "@/hooks/usePastBets";

export function PastBetsSection({
  bets,
  isLoading,
}: {
  bets: PastBet[];
  isLoading: boolean;
}) {
  return (
    <section className="rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6">
      <p className="text-xs uppercase tracking-[0.3em]">Past Bets</p>

      {isLoading ? (
        <p className="mt-3 text-sm">Loading history...</p>
      ) : bets.length === 0 ? (
        <p className="mt-3 text-sm">No past bets yet.</p>
      ) : (
        <div className="mt-3 space-y-3">
          {bets.map((bet, i) => (
            <div
              key={`${bet.marketId}-${i}`}
              className="flex flex-col items-start justify-between gap-3 rounded-lg border-2 border-border px-4 py-3 sm:flex-row sm:items-center"
            >
              <div className="min-w-0 flex-1">
                <p className="break-words text-sm font-heading">
                  {bet.question.length > 0
                    ? bet.question
                    : `Market #${bet.marketId.toString()}`}
                </p>
                <p className="text-xs">
                  {Number(formatEther(bet.amount)).toFixed(4)} ETH ·
                  Bet: {bet.choice ? "YES" : "NO"}
                </p>
              </div>
              <span
                className={`shrink-0 rounded-full border-2 border-border px-3 py-1 text-xs font-heading ${
                  bet.win ? "bg-green-200" : "bg-red-200"
                }`}
              >
                {bet.win ? "WON" : "LOST"}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
