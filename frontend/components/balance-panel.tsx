import { formatEther } from "viem";

import { AmountInput } from "@/components/amount-input";
import { Button } from "@/components/ui/button";

export function BalancePanel({
  balance,
  lossStreak,
  banned,
  hasActiveBet,
  activeBetAmount,
  activeBetChoice,
  depositAmount,
  onDepositAmountChange,
  onDeposit,
  canDeposit,
  isPending,
}: {
  balance: bigint;
  lossStreak: number;
  banned: boolean;
  hasActiveBet: boolean;
  activeBetAmount: bigint;
  activeBetChoice: boolean;
  depositAmount: string;
  onDepositAmountChange: (v: string) => void;
  onDeposit: () => void;
  canDeposit: boolean;
  isPending: boolean;
}) {
  return (
    <section className="w-full grid gap-6 rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6 md:grid-cols-2">
      <div>
        <p className="text-xs uppercase tracking-[0.3em]">Your Balance</p>
        <p className="mt-2 text-2xl font-heading sm:text-3xl">
          {Number(formatEther(balance)).toFixed(4)} ETH
        </p>
        <p className="mt-2 text-sm">
          Loss streak: <strong>{lossStreak}</strong> · Status:{" "}
          <strong>{banned ? "DEAD" : "ALIVE"}</strong>
        </p>
        {hasActiveBet && (
          <p className="mt-2 text-sm break-words">
            Active bet: {Number(formatEther(activeBetAmount)).toFixed(4)} ETH ·{" "}
            <strong>{activeBetChoice ? "YES" : "NO"}</strong>
          </p>
        )}
      </div>

      <div className="space-y-4">
        <AmountInput
          label="Add Funds (ETH)"
          placeholder="0.5"
          value={depositAmount}
          onChange={onDepositAmountChange}
        />
        <Button
          className="w-full sm:w-auto"
          disabled={!canDeposit}
          onClick={onDeposit}
        >
          Deposit ETH
        </Button>
      </div>
    </section>
  );
}
