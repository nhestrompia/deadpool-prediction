"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useConnection, useWriteContract } from "wagmi";

import { BalancePanel } from "@/components/balance-panel";
import { MarketPanel } from "@/components/market-panel";
import { PriceSection } from "@/components/price-section";
import { useArenaMarket } from "@/hooks/useArenaMarket";
import { useArenaWallet } from "@/hooks/useArenaWallet";
import { useEthPriceStream } from "@/hooks/useEthPriceStream";
import { deadpoolArenaAbi, deadpoolArenaAddress } from "@/lib/arena";
import { parseEthAmount } from "@/lib/validation";

export default function Page() {
  const { isConnected } = useConnection();
  const { price, series } = useEthPriceStream();
  const { latestMarketId, question, strike, resolveTime, resolved } =
    useArenaMarket();
  const {
    balance,
    lossStreak,
    banned,
    activeBetAmount,
    activeBetChoice,
    hasActiveBet,
    refetchWallet,
  } = useArenaWallet();

  const writeContract = useWriteContract();

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [betAmount, setBetAmount] = useState("0.1");
  const [depositAmount, setDepositAmount] = useState("0.5");
  const [pendingAction, setPendingAction] = useState<"deposit" | "bet" | null>(
    null,
  );

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => window.clearInterval(id);
  }, []);

  // Derived market state
  const secondsToResolve =
    typeof resolveTime === "bigint" ? Number(resolveTime) - now : null;
  const secondsToClose =
    typeof resolveTime === "bigint" ? Number(resolveTime) - 60 - now : null;
  const bettingClosed = secondsToClose !== null ? secondsToClose <= 0 : false;

  const questionText = question.length > 0 ? question : "No active market";

  const strikeLabel =
    typeof strike === "bigint" ? `${strike.toString()} USD` : "\u2014";

  const canBet =
    isConnected &&
    Boolean(deadpoolArenaAddress) &&
    !hasActiveBet &&
    !bettingClosed &&
    !resolved &&
    latestMarketId !== null &&
    !banned &&
    pendingAction === null;

  // Handlers
  const handleDeposit = async () => {
    if (!deadpoolArenaAddress) {
      toast.error("Contract address missing.");
      return;
    }
    const parsed = parseEthAmount(depositAmount);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    try {
      setPendingAction("deposit");
      await writeContract.mutateAsync({
        address: deadpoolArenaAddress,
        abi: deadpoolArenaAbi,
        functionName: "deposit",
        value: parsed.value,
      });
      await refetchWallet();
      toast.success("Deposit successful!");
    } catch {
      toast.error("Couldnt deposit. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  const handleBet = async (choice: boolean) => {
    if (!deadpoolArenaAddress || latestMarketId === null) {
      toast.error("No active market.");
      return;
    }
    const parsed = parseEthAmount(betAmount);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }
    if (balance < parsed.value) {
      toast.error("Insufficient balance. Please deposit first.");
      return;
    }
    try {
      setPendingAction("bet");
      await writeContract.mutateAsync({
        address: deadpoolArenaAddress,
        abi: deadpoolArenaAbi,
        functionName: "placeBet",
        args: [latestMarketId, choice, parsed.value],
      });
      await refetchWallet();
      toast.success("Bet placed!");
    } catch {
      toast.error("Couldnt place bet. Please try again.");
    } finally {
      setPendingAction(null);
    }
  };

  return (
    <main className="flex w-full flex-col gap-8">
      {!deadpoolArenaAddress && (
        <p className="rounded-lg border-2 border-border bg-secondary-background px-4 py-3 text-sm">
          Set <strong>NEXT_PUBLIC_DEADPOOL_ARENA_ADDRESS</strong> in
          <span className="font-mono"> frontend/.env</span> to enable betting.
        </p>
      )}

      <section className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <PriceSection series={series} price={price} />

        <MarketPanel
          question={questionText}
          strikeLabel={strikeLabel}
          secondsToClose={secondsToClose}
          secondsToResolve={secondsToResolve}
          resolved={resolved}
          bettingClosed={bettingClosed}
          betAmount={betAmount}
          onBetAmountChange={setBetAmount}
          onBet={handleBet}
          canBet={canBet}
          isPending={pendingAction === "bet"}
        />
      </section>

      <BalancePanel
        balance={balance}
        lossStreak={lossStreak}
        banned={banned}
        hasActiveBet={hasActiveBet}
        activeBetAmount={activeBetAmount}
        activeBetChoice={activeBetChoice}
        depositAmount={depositAmount}
        onDepositAmountChange={setDepositAmount}
        onDeposit={handleDeposit}
        canDeposit={
          isConnected &&
          Boolean(deadpoolArenaAddress) &&
          !banned &&
          pendingAction === null
        }
        isPending={pendingAction === "deposit"}
      />
    </main>
  );
}
