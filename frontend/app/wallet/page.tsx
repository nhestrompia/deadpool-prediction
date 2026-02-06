"use client";

import { useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useConnection, useWriteContract } from "wagmi";

import { AmountInput } from "@/components/amount-input";
import { PastBetsSection } from "@/components/past-bets-section";
import { Button } from "@/components/ui/button";
import { useArenaWallet } from "@/hooks/useArenaWallet";
import { usePastBets } from "@/hooks/usePastBets";
import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";
import { parseEthAmount } from "@/lib/validation";

export default function WalletPage() {
  const { address, isConnected } = useConnection();
  const {
    balance,
    lossStreak,
    banned,
    activeBetAmount,
    activeBetMarketId,
    activeBetChoice,
    activeBetQuestion,
    hasActiveBet,
    refetchWallet,
  } = useArenaWallet();

  const { bets, isLoading: betsLoading } = usePastBets();
  const writeContract = useWriteContract();

  const [withdrawAmount, setWithdrawAmount] = useState("0.1");
  const [pendingAction, setPendingAction] = useState<
    "withdraw" | "resolve" | null
  >(null);

  const handleWithdraw = async () => {
    if (!deadpoolArenaAddress) {
      toast.error("Contract address missing.");
      return;
    }
    const parsed = parseEthAmount(withdrawAmount);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    try {
      setPendingAction("withdraw");
      await writeContract.mutateAsync({
        address: deadpoolArenaAddress,
        abi: deadpoolArenaAbi,
        functionName: "withdraw",
        args: [parsed.value],
      });
      await refetchWallet();
    } catch {
      toast.error("Couldnt withdraw. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="flex w-full flex-col gap-6">
      {!deadpoolArenaAddress && (
        <p className="rounded-lg border-2 border-border bg-secondary-background px-4 py-3 text-sm">
          Set <strong>NEXT_PUBLIC_DEADPOOL_ARENA_ADDRESS</strong> in
          <span className="font-mono"> frontend/.env</span> to enable wallet
          actions.
        </p>
      )}
      <section className="grid gap-6 rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6 md:grid-cols-2">
        <div>
          <p className="text-xs uppercase tracking-[0.3em]">Status</p>
          <p className="mt-2 text-2xl font-heading sm:text-3xl">
            {Number(formatEther(balance)).toFixed(4)} ETH
          </p>
          <p className="mt-2 text-sm">
            Loss streak: <strong>{lossStreak}</strong> · Status:{" "}
            <strong>{banned ? "DEAD" : "ALIVE"}</strong>
          </p>
          <p className="mt-2 text-sm">
            Wallet:{" "}
            <span className="break-all font-mono">{address ?? "\u2014"}</span>
          </p>
        </div>

        <div className="space-y-4">
          <AmountInput
            label="Withdraw (ETH)"
            placeholder="0.1"
            value={withdrawAmount}
            onChange={setWithdrawAmount}
          />
          <Button
            className="w-full sm:w-auto"
            disabled={
              pendingAction !== null ||
              !isConnected ||
              !deadpoolArenaAddress ||
              hasActiveBet ||
              banned
            }
            onClick={handleWithdraw}
          >
            {pendingAction === "withdraw" ? "Preparing..." : "Withdraw ETH"}
          </Button>
          {hasActiveBet && (
            <p className="text-xs text-orange-900">
              Withdrawals are locked while you have an active bet.
            </p>
          )}
        </div>
      </section>

      <section className="rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6">
        <p className="text-xs uppercase tracking-[0.3em]">Active Bet</p>
        {hasActiveBet ? (
          <div className="mt-3 space-y-2 text-sm">
            {activeBetQuestion.length > 0 && (
              <p className="break-words font-heading text-base">
                {activeBetQuestion}
              </p>
            )}
            <p>
              Market: <strong>#{activeBetMarketId.toString()}</strong> · Your
              call: <strong>{activeBetChoice ? "YES" : "NO"}</strong>
            </p>
            <p>
              Amount:{" "}
              <strong>
                {Number(formatEther(activeBetAmount)).toFixed(4)} ETH
              </strong>
            </p>
          </div>
        ) : (
          <p className="mt-3 text-sm">No active bet.</p>
        )}
      </section>

      <PastBetsSection bets={bets} isLoading={betsLoading} />
    </main>
  );
}
