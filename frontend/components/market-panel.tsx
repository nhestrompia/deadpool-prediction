import { AmountInput } from "@/components/amount-input";
import { Button } from "@/components/ui/button";

export function MarketPanel({
  question,
  strikeLabel,
  secondsToClose,
  secondsToResolve,
  resolved,
  bettingClosed,
  betAmount,
  onBetAmountChange,
  onBet,
  canBet,
  isPending,
}: {
  question: string;
  strikeLabel: string;
  secondsToClose: number | null;
  secondsToResolve: number | null;
  resolved: boolean;
  bettingClosed: boolean;
  betAmount: string;
  onBetAmountChange: (v: string) => void;
  onBet: (choice: boolean) => void;
  canBet: boolean;
  isPending: boolean;
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between gap-6 rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6">
      <div className="space-y-3">
        <p className="text-xs uppercase tracking-[0.3em]">Current Market</p>
        <h2 className="text-xl font-heading sm:text-2xl break-words">
          {question}
        </h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <span className="rounded-full border-2 border-border px-3 py-1">
            Target: {strikeLabel}
          </span>
          <span className="rounded-full border-2 border-border px-3 py-1">
            Betting closes in:{" "}
            {secondsToClose !== null
              ? `${Math.max(secondsToClose, 0)}s`
              : "\u2014"}
          </span>
          <span className="rounded-full border-2 border-border px-3 py-1">
            {resolved
              ? "Resolved"
              : bettingClosed
                ? "Betting closed"
                : secondsToResolve !== null
                  ? `Resolves in ${Math.max(secondsToResolve, 0)}s`
                  : "Open"}
          </span>
        </div>
      </div>

      <div className="space-y-4">
        <AmountInput
          label="Bet Amount (ETH)"
          placeholder="0.1"
          value={betAmount}
          onChange={onBetAmountChange}
        />
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            className="flex-1"
            disabled={!canBet}
            onClick={() => onBet(true)}
          >
            {isPending ? "Preparing..." : "YES"}
          </Button>
          <Button
            className="flex-1"
            variant="neutral"
            disabled={!canBet}
            onClick={() => onBet(false)}
          >
            {isPending ? "Preparing..." : "NO"}
          </Button>
        </div>
      </div>
    </div>
  );
}
