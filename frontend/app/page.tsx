"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEther } from "viem";
import { useConnection, useWriteContract } from "wagmi";
import { waitForTransactionReceipt } from "wagmi/actions";

import { BalancePanel } from "@/components/balance-panel";
import { MarketPanel } from "@/components/market-panel";
import { PriceSection } from "@/components/price-section";
import { config } from "@/config";
import { useArenaMarket } from "@/hooks/useArenaMarket";
import { useArenaTreasury } from "@/hooks/useArenaTreasury";
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

  const { contractBalance, totalBalances, totalLocked } = useArenaTreasury();

  const { mutate: writeContract, isPending: isWritePending } =
    useWriteContract();

  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  const [betAmount, setBetAmount] = useState("0.1");
  const [depositAmount, setDepositAmount] = useState("0.5");
  const [isConfirming, setIsConfirming] = useState(false);

  const isPending = isWritePending || isConfirming;

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
    !isPending;

  // Handlers
  const handleDeposit = () => {
    if (!deadpoolArenaAddress) {
      toast.error("Contract address missing.");
      return;
    }
    const parsed = parseEthAmount(depositAmount);
    if (!parsed.ok) {
      toast.error(parsed.error);
      return;
    }

    writeContract(
      {
        address: deadpoolArenaAddress,
        abi: deadpoolArenaAbi,
        functionName: "deposit",
        value: parsed.value,
      },
      {
        onSuccess: async (hash) => {
          const toastId = toast.loading("Confirming deposit...");
          setIsConfirming(true);
          try {
            const receipt = await waitForTransactionReceipt(config, { hash });
            toast.dismiss(toastId);
            if (receipt.status === "success") {
              toast.success("Deposit confirmed!");
              refetchWallet();
            } else {
              toast.error("Deposit failed on-chain.");
            }
          } catch {
            toast.dismiss(toastId);
            toast.error("Failed to confirm deposit.");
          } finally {
            setIsConfirming(false);
          }
        },
        onError: () => {
          toast.error("Couldn't deposit. Please try again.");
        },
      },
    );
  };

  const handleBet = (choice: boolean) => {
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

    writeContract(
      {
        address: deadpoolArenaAddress,
        abi: deadpoolArenaAbi,
        functionName: "placeBet",
        args: [latestMarketId, choice, parsed.value],
      },
      {
        onSuccess: async (hash) => {
          const toastId = toast.loading("Confirming bet...");
          setIsConfirming(true);
          try {
            const receipt = await waitForTransactionReceipt(config, { hash });
            toast.dismiss(toastId);
            if (receipt.status === "success") {
              toast.success("Bet placed!");
              refetchWallet();
            } else {
              toast.error("Bet failed on-chain.");
            }
          } catch {
            toast.dismiss(toastId);
            toast.error("Failed to confirm bet.");
          } finally {
            setIsConfirming(false);
          }
        },
        onError: () => {
          toast.error("Couldn't place bet. Please try again.");
        },
      },
    );
  };

  return (
    <main className="flex w-full flex-col gap-8">
      {!deadpoolArenaAddress && (
        <p className="rounded-lg border-2 border-border bg-secondary-background px-4 py-3 text-sm">
          Set <strong>NEXT_PUBLIC_DEADPOOL_ARENA_ADDRESS</strong> in
          <span className="font-mono"> frontend/.env</span> to enable betting.
        </p>
      )}
      <section className="rounded-lg border-2 border-border bg-secondary-background p-4 shadow-shadow sm:p-6">
        <p className="text-xs uppercase tracking-[0.3em]">Arena Treasury</p>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          <p>
            Contract balance:{" "}
            <strong>
              {Number(formatEther(contractBalance)).toFixed(4)} ETH
            </strong>
          </p>

          <p>
            User balances:{" "}
            <strong>{Number(formatEther(totalBalances)).toFixed(4)} ETH</strong>
          </p>
          <p>
            Locked in bets:{" "}
            <strong>{Number(formatEther(totalLocked)).toFixed(4)} ETH</strong>
          </p>
        </div>
      </section>

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
          isPending={isPending}
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
          isConnected && Boolean(deadpoolArenaAddress) && !banned && !isPending
        }
        isPending={isPending}
      />
    </main>
  );
}
