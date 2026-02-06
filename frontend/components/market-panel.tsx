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
}) {
  return (
    <div className="flex h-full w-full flex-col justify-between gap-6 rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6">
      <div className="space-y-4">
        <p className="text-xs uppercase tracking-[0.3em]">Current Market</p>
        <h2 className="text-xl font-heading sm:text-2xl break-words">
          {question}
        </h2>
        <div className="grid grid-cols-3 gap-4 border-t border-border pt-4 text-center">
          <div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="font-heading text-lg">{strikeLabel}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Betting</p>
            <p className="font-heading text-lg tabular-nums">
              {resolved
                ? "Closed"
                : bettingClosed
                  ? "Closed"
                  : secondsToClose !== null
                    ? `${Math.max(secondsToClose, 0)}s`
                    : "\u2014"}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Resolves</p>
            <p className="font-heading text-lg tabular-nums">
              {resolved
                ? "Done"
                : secondsToResolve !== null
                  ? `${Math.max(secondsToResolve, 0)}s`
                  : "\u2014"}
            </p>
          </div>
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
            YES
          </Button>
          <Button
            className="flex-1"
            variant="neutral"
            disabled={!canBet}
            onClick={() => onBet(false)}
          >
            NO
          </Button>
        </div>
      </div>
    </div>
  );
}
